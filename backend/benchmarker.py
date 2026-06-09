import os
import json
import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from pydantic import BaseModel
from models_config import LLMCallResponse
from strategies import get_strategy, StrategySummary
from adk_engine import PersistenceManager, evaluate_response_quality

class BenchmarkRunResult(BaseModel):
    run_id: str
    timestamp: str
    strategy: str
    provider: str
    tier: str
    summary: StrategySummary
    semantic_alignment: float  # Cosine similarity with baseline or ADK Agent quality evaluation
    simulated: bool
    success: bool
    error: Optional[str] = None

def calculate_cosine_similarity(text1: str, text2: str) -> float:
    """Calculate semantic similarity between two texts using TF-IDF cosine similarity."""
    if not text1 or not text2:
        return 0.0
    if text1.strip() == text2.strip():
        return 1.0
        
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf = vectorizer.fit_transform([text1, text2])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])
        return float(sim[0][0])
    except Exception:
        # Graceful fallback: basic word intersection over union
        try:
            w1 = set(text1.lower().split())
            w2 = set(text2.lower().split())
            if not w1 or not w2:
                return 0.0
            return len(w1.intersection(w2)) / len(w1.union(w2))
        except Exception:
            return 0.5 if text1 and text2 else 0.0

persistence = PersistenceManager()

def load_history() -> List[Dict[str, Any]]:
    # Managed via PersistenceManager (which supports GCS, databases, and local JSON)
    return persistence.load_history()

def save_to_history(result: BenchmarkRunResult):
    persistence.save_run(result.model_dump())


class Benchmarker:
    def __init__(self):
        pass

    async def run_benchmark(
        self,
        prompts: List[str],
        strategies: List[str],
        providers: List[str],
        tiers: List[str],
        system_instruction: Optional[str] = None,
        simulate: bool = True,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        concurrency_limit: int = 10,
        on_progress: Optional[Callable[[str], Awaitable[None]]] = None,
        on_result: Optional[Callable[[BenchmarkRunResult], Awaitable[None]]] = None
    ) -> List[BenchmarkRunResult]:
        """
        Orchestrates benchmark runs for combinations of strategies, providers, and tiers.
        Sequential strategy is run first to establish baselines for output quality comparison.
        """
        run_id = f"run_{int(time.time())}"
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        # 1. We must run Sequential first for each provider/tier to establish baselines
        # Map: (provider, tier) -> List[outputs]
        baselines: Dict[tuple[str, str], List[str]] = {}
        results: List[BenchmarkRunResult] = []
        
        # Determine total combinations to calculate progress
        all_combinations = []
        
        # Ensure Sequential is present if we are evaluating other strategies to get baseline
        eval_strategies = list(strategies)
        has_sequential = "sequential" in [s.lower() for s in eval_strategies]
        
        # We need Sequential run for any provider/tier we are testing
        required_sequential_runs = []
        for prov in providers:
            for tier in tiers:
                required_sequential_runs.append((prov, tier))
                
        # Build list of executions
        # Baseline sequential runs go first
        execution_queue = []
        
        # 1. Add sequential runs (to collect baseline)
        for prov, tier in required_sequential_runs:
            execution_queue.append(("sequential", prov, tier))
            
        # 2. Add other strategies runs
        for strat in eval_strategies:
            if strat.lower() == "sequential":
                continue
            for prov in providers:
                for tier in tiers:
                    execution_queue.append((strat, prov, tier))
                    
        total_steps = len(execution_queue)
        
        # Execute the queue
        for step_idx, (strat_name, prov, tier) in enumerate(execution_queue):
            if on_progress:
                log_msg = f"Step {step_idx+1}/{total_steps}: Running {strat_name} on {prov} ({tier})"
                await on_progress(log_msg)
                
            try:
                # Load strategy
                strat = get_strategy(strat_name)
                
                # Define a helper callback to propagate inner strategy progress to the SSE stream
                async def inner_progress_callback(prog_data: Dict[str, Any]):
                    if on_progress:
                        prog_val = prog_data.get("progress", 0.0)
                        status_str = prog_data.get("status", "")
                        # Send detailed SSE log
                        await on_progress(
                            f"Step {step_idx+1}/{total_steps} | {strat_name} - {prov} ({tier}): "
                            f"{prog_val:.1f}% - {status_str}"
                        )
                
                # Execute strategy
                responses, summary = await strat.execute(
                    prompts=prompts,
                    provider=prov,
                    tier=tier,
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    concurrency_limit=concurrency_limit,
                    on_progress=inner_progress_callback
                )
                
                # Capture baseline outputs if this is sequential
                if strat_name == "sequential":
                    baselines[(prov, tier)] = [r.output for r in responses]
                    
                # Calculate semantic alignment score
                alignment_scores = []
                baseline_outputs = baselines.get((prov, tier))
                
                if baseline_outputs:
                    for r_idx, resp in enumerate(responses):
                        if r_idx < len(baseline_outputs):
                            if not simulate and (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")):
                                try:
                                    eval_res = await evaluate_response_quality(prompts[r_idx], resp.output)
                                    sim = eval_res.get("score", 10.0) / 10.0
                                except Exception:
                                    sim = calculate_cosine_similarity(resp.output, baseline_outputs[r_idx])
                            else:
                                sim = calculate_cosine_similarity(resp.output, baseline_outputs[r_idx])
                            alignment_scores.append(sim)
                    avg_alignment = sum(alignment_scores) / len(alignment_scores) if alignment_scores else 1.0
                else:
                    avg_alignment = 1.0  # Sequential is 1.0 by definition
                    
                # If the strategy itself is sequential, alignment is 1.0
                if strat_name == "sequential":
                    avg_alignment = 1.0
                    
                run_res = BenchmarkRunResult(
                    run_id=run_id,
                    timestamp=timestamp,
                    strategy=summary.strategy_name,
                    provider=prov,
                    tier=tier,
                    summary=summary,
                    semantic_alignment=avg_alignment,
                    simulated=simulate,
                    success=True
                )
                
                # Save only requested strategies in results if user did not ask for sequential (though we ran it for baseline)
                # Or if user did ask for sequential, keep it.
                is_requested = False
                for s in eval_strategies:
                    if s.lower() in strat_name.lower() or strat_name.lower() in s.lower():
                        is_requested = True
                        break
                        
                if is_requested or strat_name == "sequential":
                    results.append(run_res)
                    save_to_history(run_res)
                    if on_result:
                        await on_result(run_res)
                    
            except Exception as e:
                # Handle error during execution
                err_res = BenchmarkRunResult(
                    run_id=run_id,
                    timestamp=timestamp,
                    strategy=strat_name,
                    provider=prov,
                    tier=tier,
                    summary=StrategySummary(
                        strategy_name=strat_name,
                        provider=prov,
                        tier=tier,
                        total_time=0.0,
                        total_cost=0.0,
                        average_latency=0.0,
                        throughput_tps=0.0,
                        throughput_rps=0.0,
                        success_rate=0.0,
                        total_input_tokens=0,
                        total_output_tokens=0,
                        items_processed=len(prompts),
                        items_success=0,
                        items_failed=len(prompts)
                    ),
                    semantic_alignment=0.0,
                    simulated=simulate,
                    success=False,
                    error=str(e)
                )
                results.append(err_res)
                save_to_history(err_res)
                if on_result:
                    await on_result(err_res)
                if on_progress:
                    await on_progress(f"Step {step_idx+1}/{total_steps}: Failed - {str(e)}")
                    
        return results
