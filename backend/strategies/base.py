import time
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Callable, Awaitable
from pydantic import BaseModel
from models_config import execute_llm_call, LLMCallResponse

class StrategySummary(BaseModel):
    strategy_name: str
    provider: str
    tier: str
    total_time: float
    total_cost: float
    average_latency: float
    throughput_tps: float  # tokens per second
    throughput_rps: float  # requests per second
    success_rate: float
    total_input_tokens: int
    total_output_tokens: int
    items_processed: int
    items_success: int
    items_failed: int

class BaseStrategy(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
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
        pass

    async def _safe_execute_call(
        self,
        prompt: str,
        provider: str,
        tier: str,
        system_instruction: Optional[str],
        simulate: bool,
        temperature: float,
        max_tokens: int
    ) -> LLMCallResponse:
        """Helper to invoke the common LLM config/simulation engine."""
        return await execute_llm_call(
            provider=provider,
            tier=tier,
            prompt=prompt,
            system_instruction=system_instruction,
            simulate=simulate,
            temperature=temperature,
            max_tokens=max_tokens
        )

    def calculate_summary(
        self,
        responses: List[LLMCallResponse],
        elapsed_time: float,
        provider: str,
        tier: str
    ) -> StrategySummary:
        """Aggregates processing metrics across all run results."""
        items_processed = len(responses)
        items_success = sum(1 for r in responses if r.success)
        items_failed = items_processed - items_success
        
        success_rate = (items_success / items_processed) if items_processed > 0 else 0.0
        
        total_cost = sum(r.cost for r in responses)
        total_input_tokens = sum(r.input_tokens for r in responses)
        total_output_tokens = sum(r.output_tokens for r in responses)
        total_tokens = total_input_tokens + total_output_tokens
        
        avg_latency = (sum(r.latency for r in responses) / items_processed) if items_processed > 0 else 0.0
        
        throughput_rps = (items_processed / elapsed_time) if elapsed_time > 0 else 0.0
        throughput_tps = (total_tokens / elapsed_time) if elapsed_time > 0 else 0.0
        
        return StrategySummary(
            strategy_name=self.name,
            provider=provider,
            tier=tier,
            total_time=elapsed_time,
            total_cost=total_cost,
            average_latency=avg_latency,
            throughput_tps=throughput_tps,
            throughput_rps=throughput_rps,
            success_rate=success_rate,
            total_input_tokens=total_input_tokens,
            total_output_tokens=total_output_tokens,
            items_processed=items_processed,
            items_success=items_success,
            items_failed=items_failed
        )
