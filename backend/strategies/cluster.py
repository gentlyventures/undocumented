import time
import asyncio
from typing import List, Dict, Any, Optional, Callable, Awaitable
from strategies.base import BaseStrategy, StrategySummary
from models_config import LLMCallResponse

class ClusterStrategy(BaseStrategy):
    """
    Semantic Clustering Strategy:
    In sandbox mode, this strategy simulates prompt clustering cache benefits (shared prompt prefixes)
    by grouping incoming prompts semantically using scikit-learn (K-Means/TF-IDF) and applying a
    30% cost discount on subsequent calls within the same cluster to represent input token caching.
    """
    def __init__(self):
        super().__init__("Semantic Clustering")

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
        total_items = len(prompts)
        
        # 1. Cluster the prompts semantically using scikit-learn
        clusters: Dict[int, List[tuple[int, str]]] = {}
        
        if len(prompts) > 1:
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.cluster import KMeans
                
                # Determine number of clusters: K = min(3, number of items)
                n_clusters = min(3, len(prompts))
                
                vectorizer = TfidfVectorizer(stop_words='english')
                tfidf_matrix = vectorizer.fit_transform(prompts)
                
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
                labels = kmeans.fit_predict(tfidf_matrix)
                
                for idx, (label, prompt) in enumerate(zip(labels, prompts)):
                    if label not in clusters:
                        clusters[label] = []
                    clusters[label].append((idx, prompt))
            except Exception as e:
                # Fallback to single cluster if scikit-learn fails or input size is too small
                clusters = {0: list(enumerate(prompts))}
        else:
            clusters = {0: list(enumerate(prompts))}
            
        responses: List[LLMCallResponse] = [None] * len(prompts)
        completed = 0
        
        # Process each cluster. Inside each cluster, process concurrently with semaphore.
        # Subsequent requests in the same cluster get a 30% input token cost discount 
        # to simulate prompt caching benefits (shared prompt prefixes).
        semaphore = asyncio.Semaphore(concurrency_limit)
        
        async def process_cluster_item(idx: int, prompt: str, is_first_in_cluster: bool, cluster_id: int):
            nonlocal completed
            async with semaphore:
                # Simulate a small grouping latency/overhead for first item
                if is_first_in_cluster:
                    await asyncio.sleep(0.1)
                    
                response = await self._safe_execute_call(
                    prompt=prompt,
                    provider=provider,
                    tier=tier,
                    system_instruction=system_instruction,
                    simulate=simulate,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                # Apply 30% input token cost discount for prompt caching on subsequent items
                if not is_first_in_cluster and response.success:
                    # Recalculate cost with 30% discount on inputs
                    from models_config import MODEL_CONFIGS
                    prov = provider.lower()
                    t = tier.lower()
                    if prov in MODEL_CONFIGS and t in MODEL_CONFIGS[prov]:
                        cfg = MODEL_CONFIGS[prov][t]
                        discounted_input_cost = (response.input_tokens * cfg["input_cost_per_m"] * 0.7) / 1000000.0
                        output_cost = (response.output_tokens * cfg["output_cost_per_m"]) / 1000000.0
                        response.cost = discounted_input_cost + output_cost
                
                responses[idx] = response
                completed += 1
                
                if on_progress:
                    progress_percentage = (completed / total_items) * 100
                    await on_progress({
                        "progress": progress_percentage,
                        "completed": completed,
                        "total": total_items,
                        "status": f"Cluster {cluster_id} processed {completed}/{total_items}",
                        "current_item": {
                            "prompt": prompt[:40] + "...",
                            "success": response.success,
                            "latency": response.latency,
                            "cost": response.cost
                        }
                    })

        # Run clusters
        tasks = []
        for cluster_id, items in clusters.items():
            for i, (original_idx, prompt) in enumerate(items):
                is_first = (i == 0)
                tasks.append(process_cluster_item(original_idx, prompt, is_first, cluster_id))
                
        await asyncio.gather(*tasks)
        
        elapsed = time.time() - start_time
        summary = self.calculate_summary(responses, elapsed, provider, tier)
        return responses, summary
