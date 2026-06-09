import time
import asyncio
import random
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse, estimate_tokens

class FanOutEmbeddingsStrategy(BaseStrategy):
    def __init__(self):
        super().__init__("Fan-out with Embeddings")

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
        
        # Embedding configuration (e.g., text-embedding-3-small pricing: $0.02 / 1M tokens)
        EMBEDDING_COST_PER_M = 0.02
        EMBEDDING_BASE_LATENCY = 0.08
        
        completed = 0
        total_items = len(prompts)
        responses: List[LLMCallResponse] = [None] * len(prompts)
        semaphore = asyncio.Semaphore(concurrency_limit)

        async def process_item(idx: int, prompt: str):
            nonlocal completed
            async with semaphore:
                # 1. Step 1: Simulate Embedding Call
                prompt_tokens = estimate_tokens(prompt)
                
                # Simulate embedding latency
                emb_latency = EMBEDDING_BASE_LATENCY + random.uniform(0.01, 0.04)
                await asyncio.sleep(emb_latency)
                
                emb_cost = (prompt_tokens * EMBEDDING_COST_PER_M) / 1000000.0
                
                # 2. Step 2: Run LLM Generation call
                # In a RAG pipeline, the prompt would be augmented with context.
                # We can simulate context augmentation by prepending a mock context string.
                augmented_prompt = f"[Retrieved Vector Context: Semantic chunk matched with embedding index]\n{prompt}"
                
                llm_response = await self._safe_execute_call(
                    prompt=augmented_prompt,
                    provider=provider,
                    tier=tier,
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                # Add embedding overhead to response metrics
                llm_response.cost += emb_cost
                llm_response.latency += emb_latency
                llm_response.input_tokens += prompt_tokens # add original tokens counted in embedding
                
                responses[idx] = llm_response
                completed += 1
                
                if on_progress:
                    progress_percentage = (completed / total_items) * 100
                    await on_progress({
                        "progress": progress_percentage,
                        "completed": completed,
                        "total": total_items,
                        "status": f"Processed embedding + LLM for {completed}/{total_items}",
                        "current_item": {
                            "prompt": prompt[:40] + "...",
                            "success": llm_response.success,
                            "latency": llm_response.latency,
                            "cost": llm_response.cost
                        }
                    })

        tasks = [process_item(i, p) for i, p in enumerate(prompts)]
        await asyncio.gather(*tasks)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary
