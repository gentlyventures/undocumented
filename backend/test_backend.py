import asyncio
import json
import os
from analyzer import analyze_directory
from benchmarker import Benchmarker

async def main():
    print("--- 1. Testing Code Analyzer ---")
    current_dir = os.path.dirname(os.path.abspath(__file__))
    analysis = analyze_directory(current_dir)
    
    print(f"Detected Imports: {len(analysis['imports'])}")
    print(f"Detected Call Sites: {len(analysis['call_sites'])}")
    print(f"Detected Configurations: {len(analysis['configurations'])}")
    print(f"Detected Templates: {len(analysis['prompt_templates'])}")
    print(f"Generated Mock Payloads: {len(analysis['mock_payloads'])}")
    
    if analysis['mock_payloads']:
        print(f"Sample Payload Keys: {list(analysis['mock_payloads'][0]['placeholders'].keys())}")
        
    print("\n--- 2. Testing Benchmarker (Simulation Mode) ---")
    benchmarker = Benchmarker()
    
    prompts = [
        "Create an architectural diagram for a parallel processing LLM agent group.",
        "How does semantic clustering optimize prompt cache hits for identical templates?"
    ]
    
    # We will test all strategies including the new research-backed ones
    strategies_to_test = ["sequential", "concurrent", "cluster", "caching", "pruning", "sliding_window", "queue_batch"]
    providers_to_test = ["openai", "gemini"]
    tiers_to_test = ["low", "medium"]
    
    async def log_callback(msg):
        print(f"  [Progress Log]: {msg}")
        
    print("Launching benchmark run...")
    results = await benchmarker.run_benchmark(
        prompts=prompts,
        strategies=strategies_to_test,
        providers=providers_to_test,
        tiers=tiers_to_test,
        simulate=True,  # Test offline simulation
        on_progress=log_callback
    )
    
    print("\n--- 3. Benchmark Results Summary ---")
    for res in results:
        print(f"\nStrategy: {res.strategy}")
        print(f"Provider: {res.provider} ({res.tier})")
        print(f"  Total Time: {res.summary.total_time:.3f}s")
        print(f"  Total Cost: ${res.summary.total_cost:.6f}")
        print(f"  Throughput (RPS): {res.summary.throughput_rps:.2f}")
        print(f"  Throughput (TPS): {res.summary.throughput_tps:.2f}")
        print(f"  Semantic Alignment with Baseline: {res.semantic_alignment:.2f}")
        print(f"  Success Rate: {res.summary.success_rate * 100:.1f}%")

if __name__ == "__main__":
    asyncio.run(main())
