import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse, estimate_tokens
from strategies.rate_limiter import TokenBucketRateLimiter

class ConcurrentStrategy(BaseStrategy):
    def __init__(self):
        super().__init__("Async Concurrent")

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
        semaphore = asyncio.Semaphore(concurrency_limit)
        
        # Determine rate limits
        rpm_limit = kwargs.get("rpm_limit")
        tpm_limit = kwargs.get("tpm_limit")
        
        if rpm_limit is None:
            rpm_defaults = {"low": 300, "medium": 100, "high": 30}
            rpm_limit = rpm_defaults.get(tier.lower(), 100)
            
        if tpm_limit is None:
            tpm_defaults = {"low": 40000, "medium": 80000, "high": 150000}
            tpm_limit = tpm_defaults.get(tier.lower(), 80000)
            
        rate_limiter = TokenBucketRateLimiter(rpm_limit=rpm_limit, tpm_limit=tpm_limit)
        
        completed = 0
        total_items = len(prompts)
        
        async def worker(idx: int, prompt: str):
            nonlocal completed
            async with semaphore:
                estimated_tokens = estimate_tokens(prompt) + max_tokens
                await rate_limiter.acquire(estimated_tokens)
                
                response = await self._safe_execute_call(
                    prompt=prompt,
                    provider=provider,
                    tier=tier,
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                responses[idx] = response
                completed += 1
                
                if on_progress:
                    progress_percentage = (completed / total_items) * 100
                    await on_progress({
                        "progress": progress_percentage,
                        "completed": completed,
                        "total": total_items,
                        "status": f"Concurrently processed {completed}/{total_items} items",
                        "current_item": {
                            "prompt": prompt[:40] + "...",
                            "success": response.success,
                            "latency": response.latency,
                            "cost": response.cost
                        }
                    })

        tasks = [worker(i, p) for i, p in enumerate(prompts)]
        await asyncio.gather(*tasks)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary

