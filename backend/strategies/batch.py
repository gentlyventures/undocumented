import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse

class BatchAPIStrategy(BaseStrategy):
    """
    Batch API Strategy:
    In sandbox mode, this strategy simulates the Batch API flow, including submission overhead delay,
    polling status updates, and retrieving final results. It applies a 50% discount on LLM cost 
    to represent official Batch API pricing structure.
    """
    def __init__(self):
        super().__init__("Batch API")

    async def execute(
        self,
        prompts: List[str],
        provider: str,
        tier: str,
        system_instruction: Optional[str] = None,
        simulate: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        concurrency_limit: int = 20,
        on_progress: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        **kwargs
    ) -> tuple[List[LLMCallResponse], StrategySummary]:
        start_time = time.time()
        
        # 1. Simulate Batch Submission Overhead
        if on_progress:
            await on_progress({
                "progress": 5.0,
                "completed": 0,
                "total": len(prompts),
                "status": "Submitting prompts to batch endpoint...",
                "current_item": None
            })
        await asyncio.sleep(0.8) # Simulated network submission delay
        
        # 2. Simulate Batch API Processing and Polling
        # In a real batch API, we poll periodically. Let's do 3 quick polling cycles.
        polling_steps = 3
        for step in range(polling_steps):
            if on_progress:
                progress = 5.0 + ((step + 1) / polling_steps) * 45.0
                await on_progress({
                    "progress": progress,
                    "completed": 0,
                    "total": len(prompts),
                    "status": f"Polling batch execution status... (Cycle {step+1}/{polling_steps})",
                    "current_item": None
                })
            # Real batch APIs take minutes/hours, we simulate it with a short sleep
            await asyncio.sleep(0.5)

        # 3. Retrieve batch results (processed on the backend concurrently)
        # We process them concurrently with high speed (no rate limits since it was off-line batch)
        responses: List[LLMCallResponse] = [None] * len(prompts)
        
        # Batch API processes everything, we run them concurrently in the sandbox.
        async def fetch_item(idx: int, prompt: str):
            response = await self._safe_execute_call(
                prompt=prompt,
                provider=provider,
                tier=tier,
                system_instruction=system_instruction,
                # Force simulation if required, but execute normally otherwise
                simulate=simulate,
                temperature=temperature,
                max_tokens=max_tokens
            )
            # Batch API gives 50% discount on cost
            response.cost *= 0.5
            # In batch API, the latency of individual items is not reflective of the total pipeline delay,
            # but we record it. The actual elapsed time represents the pipeline batch delay.
            responses[idx] = response

        tasks = [fetch_item(i, p) for i, p in enumerate(prompts)]
        await asyncio.gather(*tasks)
        
        # Update progress to 100%
        if on_progress:
            await on_progress({
                "progress": 100.0,
                "completed": len(prompts),
                "total": len(prompts),
                "status": "Batch processing completed. Results fetched.",
                "current_item": None
            })

        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary
