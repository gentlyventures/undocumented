import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse, estimate_tokens
from strategies.rate_limiter import TokenBucketRateLimiter

class WorkerPoolStrategy(BaseStrategy):
    def __init__(self):
        super().__init__("Distributed Worker Pool")

    async def execute(
        self,
        prompts: List[str],
        provider: str,
        tier: str,
        system_instruction: Optional[str] = None,
        simulate: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        concurrency_limit: int = 5,
        on_progress: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        **kwargs
    ) -> tuple[List[LLMCallResponse], StrategySummary]:
        start_time = time.time()
        
        queue = asyncio.Queue()
        # Put all prompts with their index into the queue
        for idx, prompt in enumerate(prompts):
            await queue.put((idx, prompt))
            
        responses: List[LLMCallResponse] = [None] * len(prompts)
        completed = 0
        total_items = len(prompts)
        
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
        
        from adk_engine import DistributedCacheManager
        cache_manager = DistributedCacheManager()

        async def worker(worker_id: int):
            nonlocal completed
            while not queue.empty():
                try:
                    idx, prompt = await queue.get()
                except asyncio.QueueEmpty:
                    break
                
                # Check cache
                cache_key = f"prompt_cache:{provider}:{tier}:{prompt}"
                cached_output = cache_manager.get(cache_key)
                
                if cached_output:
                    from models_config import MODEL_CONFIGS
                    mname = MODEL_CONFIGS.get(provider, {}).get(tier, {}).get("name", "cached-model")
                    response = LLMCallResponse(
                        provider=provider,
                        tier=tier,
                        model_name=mname,
                        prompt=prompt,
                        output=cached_output,
                        input_tokens=0,
                        output_tokens=0,
                        cost=0.0,
                        latency=0.005,
                        simulated=True,
                        success=True
                    )
                else:
                    # Process the prompt (Acquire from rate limiter)
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
                    if response.success:
                        cache_manager.set(cache_key, response.output)
                        
                responses[idx] = response
                completed += 1
                
                if on_progress:
                    progress_percentage = (completed / total_items) * 100
                    await on_progress({
                        "progress": progress_percentage,
                        "completed": completed,
                        "total": total_items,
                        "status": f"Worker {worker_id} processed {completed}/{total_items} items",
                        "current_item": {
                            "prompt": prompt[:40] + "...",
                            "success": response.success,
                            "latency": response.latency,
                            "cost": response.cost
                        }
                    })
                queue.task_done()

        # Spawn workers
        num_workers = min(concurrency_limit, len(prompts))
        workers = [asyncio.create_task(worker(w_id)) for w_id in range(num_workers)]
        
        # Wait for all workers to finish
        await asyncio.gather(*workers)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary

