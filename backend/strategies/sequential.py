import time
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse

class SequentialStrategy(BaseStrategy):
    def __init__(self):
        super().__init__("Sequential (Baseline)")

    async def execute(
        self,
        prompts: List[str],
        provider: str,
        tier: str,
        system_instruction: Optional[str] = None,
        simulate: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        concurrency_limit: int = 1,
        on_progress: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
        **kwargs
    ) -> tuple[List[LLMCallResponse], StrategySummary]:
        start_time = time.time()
        responses: List[LLMCallResponse] = []
        
        total_items = len(prompts)
        for idx, prompt in enumerate(prompts):
            # Call single item
            response = await self._safe_execute_call(
                prompt=prompt,
                provider=provider,
                tier=tier,
                system_instruction=system_instruction,
                simulate=simulate,
                temperature=temperature,
                max_tokens=max_tokens
            )
            responses.append(response)
            
            # Progress callback
            if on_progress:
                completed = idx + 1
                progress_percentage = (completed / total_items) * 100
                await on_progress({
                    "progress": progress_percentage,
                    "completed": completed,
                    "total": total_items,
                    "status": f"Processed item {completed}/{total_items}",
                    "current_item": {
                        "prompt": prompt[:40] + "...",
                        "success": response.success,
                        "latency": response.latency,
                        "cost": response.cost
                    }
                })
                
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary
