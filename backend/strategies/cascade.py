import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse, estimate_tokens
from adk_engine import evaluate_response_quality
from strategies.rate_limiter import TokenBucketRateLimiter

class CascadeStrategy(BaseStrategy):
    def __init__(self):
        super().__init__("Hybrid Model Cascading")

    async def execute(
        self,
        prompts: List[str],
        provider: str,
        tier: str, # Usually run on standard tier which maps to low-to-medium cascading
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
        
        total_items = len(prompts)
        escalations = 0
        completed = 0
        
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
        semaphore = asyncio.Semaphore(concurrency_limit)
        
        async def process_prompt(idx: int, prompt: str):
            nonlocal escalations, completed
            async with semaphore:
                # 1. Acquire from rate limiter for the low-tier call
                estimated_tokens_low = estimate_tokens(prompt) + max_tokens
                await rate_limiter.acquire(estimated_tokens_low)
                
                low_response = await self._safe_execute_call(
                    prompt=prompt,
                    provider=provider,
                    tier="low",
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                # 2. Evaluate output quality using ADK QualityEvaluatorAgent
                eval_res = await evaluate_response_quality(prompt, low_response.output)
                needs_escalation = eval_res.get("needs_escalation", False)
                
                final_response = low_response
                status_text = f"Item {idx + 1} processed using low-tier model"
                
                # 3. Escalate to standard model if quality fails
                if needs_escalation:
                    escalations += 1
                    status_text = f"Item {idx + 1} escalated to medium-tier model"
                    
                    # Acquire from rate limiter for the medium-tier call
                    estimated_tokens_med = estimate_tokens(prompt) + max_tokens
                    await rate_limiter.acquire(estimated_tokens_med)
                    
                    high_response = await self._safe_execute_call(
                        prompt=prompt,
                        provider=provider,
                        tier="medium",
                        system_instruction=system_instruction,
                        simulate=simulate,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    
                    # Combine costs and latency representing the real cascade
                    high_response.cost += low_response.cost
                    high_response.latency += low_response.latency
                    final_response = high_response
                    
                responses[idx] = final_response
                completed += 1
                
                # 4. Progress callback
                if on_progress:
                    progress_percentage = (completed / total_items) * 100
                    await on_progress({
                        "progress": progress_percentage,
                        "completed": completed,
                        "total": total_items,
                        "status": f"{status_text} ({completed}/{total_items})",
                        "current_item": {
                            "prompt": prompt[:40] + "...",
                            "success": final_response.success,
                            "latency": final_response.latency,
                            "cost": final_response.cost,
                            "escalated": needs_escalation
                        }
                    })

        tasks = [process_prompt(i, p) for i, p in enumerate(prompts)]
        await asyncio.gather(*tasks)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary

