import os
import sys
import asyncio
from typing import List, Dict, Any, Optional
from mcp.server.fastmcp import FastMCP

# Ensure parent directory is in system path for clean imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from analyzer import analyze_directory
from benchmarker import Benchmarker
from models_config import LLMCallResponse

# Initialize FastMCP server
mcp = FastMCP("UnDocumented-Optimizer")

@mcp.tool()
def scan_repository(directory: str) -> Dict[str, Any]:
    """
    Scans a local repository directory using AST parsing.
    Returns imports, LLM call sites, configurations, prompt templates, and security alerts.
    """
    target_dir = os.path.abspath(directory.strip() if directory.strip() else os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.environ.get("UNDOCUMENTED_WORKSPACE_ROOT")
    if workspace_root:
        base_dir = os.path.abspath(workspace_root)
    else:
        # Default to the parent folder of the backend folder (which is the repository root)
        base_dir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
    if not target_dir.startswith(base_dir) and not target_dir.startswith(os.path.abspath(os.getcwd())):
        return {
            "status": "error",
            "message": f"Security Violation: Target path '{directory}' is outside the authorized workspace."
        }
        
    if not os.path.exists(target_dir):
        return {"status": "error", "message": f"Directory path does not exist: {target_dir}"}
        
    try:
        result = analyze_directory(target_dir)
        return {
            "status": "success",
            "directory": target_dir,
            "detected_imports_count": len(result.get("imports", [])),
            "detected_call_sites": result.get("call_sites", []),
            "prompt_templates": result.get("prompt_templates", [])
        }
    except Exception as e:
        return {"status": "error", "message": f"Scan failed: {str(e)}"}

@mcp.tool()
async def benchmark_codebase(
    prompts: List[str],
    strategies: List[str],
    providers: List[str],
    tiers: List[str],
    simulate: bool = True
) -> Dict[str, Any]:
    """
    Runs dynamic optimization benchmarks on prompts across selected strategies, providers, and tiers.
    Strategies: 'sequential', 'concurrent', 'batch', 'worker_pool', 'fanout', 'cluster', 'cascade'.
    Providers: 'openai', 'gemini', 'anthropic', 'mistral', 'meta'.
    Tiers: 'low', 'medium', 'high'.
    """
    # Map strategies, providers and tiers to lower case clean names
    mapped_strategies = [s.strip().lower() for s in strategies]
    mapped_providers = [p.strip().lower() for p in providers]
    mapped_tiers = [t.strip().lower() for t in tiers]
    
    benchmarker = Benchmarker()
    try:
        results = await benchmarker.run_benchmark(
            prompts=prompts,
            strategies=mapped_strategies,
            providers=mapped_providers,
            tiers=mapped_tiers,
            simulate=simulate
        )
        
        # Serialize run results for tool return
        serialized = []
        for r in results:
            serialized.append({
                "strategy": r.strategy,
                "provider": r.provider,
                "tier": r.tier,
                "total_time": round(r.summary.total_time, 3),
                "total_cost": round(r.summary.total_cost, 6),
                "throughput_rps": round(r.summary.throughput_rps, 2),
                "throughput_tps": round(r.summary.throughput_tps, 2),
                "success_rate": round(r.summary.success_rate * 100.0, 1),
                "semantic_alignment": round(r.semantic_alignment * 100.0, 1)
            })
            
        return {
            "status": "success",
            "results": serialized
        }
    except Exception as e:
        return {"status": "error", "message": f"Benchmark execution failed: {str(e)}"}

if __name__ == "__main__":
    mcp.run(transport="stdio")
