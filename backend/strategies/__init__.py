from strategies.sequential import SequentialStrategy
from strategies.concurrent import ConcurrentStrategy
from strategies.batch import BatchAPIStrategy
from strategies.worker_pool import WorkerPoolStrategy
from strategies.fanout import FanOutEmbeddingsStrategy
from strategies.cluster import ClusterStrategy
from strategies.cascade import CascadeStrategy
from strategies.caching import CachingStrategy
from strategies.pruning import PruningStrategy
from strategies.sliding_window import SlidingWindowStrategy
from strategies.queue_batch import QueueBatchStrategy
from strategies.base import BaseStrategy, StrategySummary

STRATEGY_MAP = {
    "sequential": SequentialStrategy,
    "concurrent": ConcurrentStrategy,
    "batch": BatchAPIStrategy,
    "worker_pool": WorkerPoolStrategy,
    "fanout": FanOutEmbeddingsStrategy,
    "cluster": ClusterStrategy,
    "cascade": CascadeStrategy,
    "caching": CachingStrategy,
    "pruning": PruningStrategy,
    "sliding_window": SlidingWindowStrategy,
    "queue_batch": QueueBatchStrategy
}

def get_strategy(name: str) -> BaseStrategy:
    name_lower = name.lower()
    # Check for exact matches first
    if name_lower in STRATEGY_MAP:
        return STRATEGY_MAP[name_lower]()
    for key, strategy_class in STRATEGY_MAP.items():
        if key in name_lower or name_lower in key:
            return strategy_class()
    raise ValueError(f"Strategy {name} not found. Available: {list(STRATEGY_MAP.keys())}")

