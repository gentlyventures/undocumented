import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse, estimate_tokens

class CachingStrategy(BaseStrategy):
    """
    Stateful Semantic Caching Strategy:
    Checks for exact or semantic hits (cosine similarity >= threshold) against 
    previously resolved queries. Hits bypass downstream LLM APIs, resolving 
    in ~50ms at zero token cost.
    """
    def __init__(self, threshold: float = 0.90):
        super().__init__("Stateful Semantic Caching")
        self.threshold = threshold
        self.exact_cache: Dict[str, LLMCallResponse] = {}
        # In a real vector cache, we'd store embeddings. Here we simulate it
        # by checking string similarity or overlap.
        self.resolved_queries: List[tuple[str, LLMCallResponse]] = []

    def _calculate_string_similarity(self, s1: str, s2: str) -> float:
        """Helper to compute string token overlap as a mock cosine similarity."""
        w1 = set(s1.lower().split())
        w2 = set(s2.lower().split())
        intersection = w1.intersection(w2)
        union = w1.union(w2)
        return len(intersection) / len(union) if union else 0.0

    async def execute(
        self,
        prompts: List[str],
        provider: str,
        tier: str,
        system_instruction: Optional[str] = None,
        simulate: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        concurrency_limit: int = 10,
        on_progress: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        **kwargs
    ) -> tuple[List[LLMCallResponse], StrategySummary]:
        start_time = time.time()
        responses: List[LLMCallResponse] = [None] * len(prompts)
        completed = 0
        total_items = len(prompts)
        
        semaphore = asyncio.Semaphore(concurrency_limit)
        
        async def process_prompt(idx: int, prompt: str):
            nonlocal completed
            async with semaphore:
                # 1. Exact Match Check
                clean_prompt = prompt.strip()
                if clean_prompt in self.exact_cache:
                    cached = self.exact_cache[clean_prompt]
                    # Create a mock hit response
                    hit_response = LLMCallResponse(
                        provider=provider,
                        tier=tier,
                        model_name=cached.model_name,
                        prompt=prompt,
                        output=cached.output,
                        input_tokens=0,
                        output_tokens=0,
                        cost=0.0,
                        latency=0.05, # ~50ms cache lookup
                        simulated=True,
                        success=True
                    )
                    responses[idx] = hit_response
                    completed += 1
                    await self._notify_progress(idx, prompt, hit_response, completed, total_items, "EXACT_CACHE_HIT", on_progress)
                    return

                # 2. Semantic Similarity Check
                best_sim = 0.0
                best_cached: Optional[LLMCallResponse] = None
                for cached_query, cached_resp in self.resolved_queries:
                    sim = self._calculate_string_similarity(clean_prompt, cached_query)
                    if sim > best_sim:
                        best_sim = sim
                        best_cached = cached_resp
                        
                if best_sim >= self.threshold and best_cached is not None:
                    # Semantic cache hit
                    hit_response = LLMCallResponse(
                        provider=provider,
                        tier=tier,
                        model_name=best_cached.model_name,
                        prompt=prompt,
                        output=best_cached.output,
                        input_tokens=0,
                        output_tokens=0,
                        cost=0.0,
                        latency=0.08, # ~80ms embedding + lookup
                        simulated=True,
                        success=True
                    )
                    responses[idx] = hit_response
                    completed += 1
                    await self._notify_progress(idx, prompt, hit_response, completed, total_items, f"SEMANTIC_CACHE_HIT (Sim: {best_sim:.2f})", on_progress)
                    return

                # 3. Cache Miss - Execute real/simulated LLM call
                response = await self._safe_execute_call(
                    prompt=prompt,
                    provider=provider,
                    tier=tier,
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                # Insert into cache databases
                if response.success:
                    self.exact_cache[clean_prompt] = response
                    self.resolved_queries.append((clean_prompt, response))
                    
                responses[idx] = response
                completed += 1
                await self._notify_progress(idx, prompt, response, completed, total_items, "CACHE_MISS (Executed LLM)", on_progress)

        tasks = [process_prompt(i, p) for i, p in enumerate(prompts)]
        await asyncio.gather(*tasks)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary

    async def _notify_progress(
        self,
        idx: int,
        prompt: str,
        response: LLMCallResponse,
        completed: int,
        total_items: int,
        status_text: str,
        on_progress: Optional[Callable[[Dict[str, Any]], Awaitable[None]]]
    ):
        if on_progress:
            progress_percentage = (completed / total_items) * 100
            await on_progress({
                "progress": progress_percentage,
                "completed": completed,
                "total": total_items,
                "status": f"Item {idx + 1}: {status_text} ({completed}/{total_items})",
                "current_item": {
                    "prompt": prompt[:40] + "...",
                    "success": response.success,
                    "latency": response.latency,
                    "cost": response.cost
                }
            })
