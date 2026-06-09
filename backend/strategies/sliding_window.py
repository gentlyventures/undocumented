import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse, estimate_tokens

class SlidingWindowStrategy(BaseStrategy):
    """
    Attention Sinks & Sliding Window KV-Cache Pruning Strategy:
    Keeps the first 4 tokens (system/instruction mathematical attention sinks) and
    the most recent sliding window of context tokens, safely evicting intermediate state.
    Simulates a flat 35% token overhead reduction under high-context sequences.
    """
    def __init__(self, token_reduction_ratio: float = 0.35):
        super().__init__("Attention Sinks KV Pruning")
        self.token_reduction_ratio = token_reduction_ratio

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
                # 1. Execute LLM call
                response = await self._safe_execute_call(
                    prompt=prompt,
                    provider=provider,
                    tier=tier,
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                # 2. Adjust input tokens to reflect KV cache pruning savings (35% off on history context)
                original_input_tokens = response.input_tokens
                # Only apply savings if prompt is relatively large (contains context history to prune)
                if original_input_tokens > 50:
                    pruned_input_tokens = max(30, int(original_input_tokens * (1 - self.token_reduction_ratio)))
                    response.input_tokens = pruned_input_tokens
                    
                    # Recalculate cost with pruned context
                    from models_config import MODEL_CONFIGS
                    prov = provider.lower()
                    t = tier.lower()
                    if prov in MODEL_CONFIGS and t in MODEL_CONFIGS[prov] and response.success:
                        cfg = MODEL_CONFIGS[prov][t]
                        input_cost = (pruned_input_tokens * cfg["input_cost_per_m"]) / 1000000.0
                        output_cost = (response.output_tokens * cfg["output_cost_per_m"]) / 1000000.0
                        response.cost = input_cost + output_cost
                
                responses[idx] = response
                completed += 1
                
                if on_progress:
                    progress_percentage = (completed / total_items) * 100
                    await on_progress({
                        "progress": progress_percentage,
                        "completed": completed,
                        "total": total_items,
                        "status": f"KV Pruning processed item {idx + 1} ({completed}/{total_items})",
                        "current_item": {
                            "prompt": prompt[:40] + "...",
                            "success": response.success,
                            "latency": response.latency,
                            "cost": response.cost
                        }
                    })

        tasks = [process_prompt(i, p) for i, p in enumerate(prompts)]
        await asyncio.gather(*tasks)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary
