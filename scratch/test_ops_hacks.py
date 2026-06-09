import asyncio
import time
import math
import re
import ast
import random
import tiktoken
from typing import Dict, Tuple, Optional, List, Any

# ==========================================
# Strategy 1: Token-Aware Multi-Tier Router
# ==========================================

class TokenBucket:
    def __init__(self, name: str, tpm: int, rpm: int):
        self.name = name
        self.tpm_limit = tpm
        self.rpm_limit = rpm
        self.token_capacity = tpm
        self.request_capacity = rpm
        self.tokens = float(tpm)
        self.requests = float(rpm)
        self.last_update = time.time()
        self.lock = asyncio.Lock()

    async def _replenish(self):
        now = time.time()
        elapsed = now - self.last_update
        self.last_update = now
        token_refill = elapsed * (self.tpm_limit / 60.0)
        self.tokens = min(float(self.token_capacity), self.tokens + token_refill)
        request_refill = elapsed * (self.rpm_limit / 60.0)
        self.requests = min(float(self.request_capacity), self.requests + request_refill)

    async def try_acquire(self, tokens_needed: int) -> bool:
        async with self.lock:
            await self._replenish()
            if self.tokens >= tokens_needed and self.requests >= 1.0:
                self.tokens -= tokens_needed
                self.requests -= 1.0
                return True
            return False

    async def refund(self, tokens_to_refund: int):
        async with self.lock:
            await self._replenish()
            self.tokens = min(float(self.token_capacity), self.tokens + tokens_to_refund)

class TokenAwareRouter:
    def __init__(self, primary: TokenBucket, fallback: TokenBucket):
        self.primary = primary
        self.fallback = fallback

    async def route_request(self, prompt: str, max_tokens: int) -> Tuple[str, str]:
        prompt_tokens = int(len(prompt.split()) * 1.33)
        reserved_tokens = prompt_tokens + max_tokens
        
        if await self.primary.try_acquire(reserved_tokens):
            print(f"[Router] Routing to PRIMARY ({self.primary.name}) - Reserved: {reserved_tokens} tokens.")
            actual_output = await self._simulate_llm_execution(self.primary.name, max_tokens)
            actual_output_tokens = int(len(actual_output.split()) * 1.33)
            refund = max_tokens - actual_output_tokens
            if refund > 0:
                await self.primary.refund(refund)
                print(f"[Router] PRIMARY Refunded: {refund} tokens.")
            return self.primary.name, actual_output
            
        elif await self.fallback.try_acquire(reserved_tokens):
            print(f"[Router] PRIMARY starved. Routing to FALLBACK ({self.fallback.name}) - Reserved: {reserved_tokens} tokens.")
            actual_output = await self._simulate_llm_execution(self.fallback.name, max_tokens)
            actual_output_tokens = int(len(actual_output.split()) * 1.33)
            refund = max_tokens - actual_output_tokens
            if refund > 0:
                await self.fallback.refund(refund)
                print(f"[Router] FALLBACK Refunded: {refund} tokens.")
            return self.fallback.name, actual_output
            
        else:
            raise Exception("Rate limits exhausted across all available tiers.")

    async def _simulate_llm_execution(self, name: str, max_tokens: int) -> str:
        await asyncio.sleep(0.05)
        actual_words = int((max_tokens * 0.2) / 1.33)
        return " ".join(["token"] * max(5, actual_words))

# ==========================================
# Strategy 2: Caching Prompt Serializer
# ==========================================

class CachingPromptSerializer:
    def __init__(self, block_size: int = 16, encoding_name: str = "cl100k_base"):
        self.block_size = block_size
        self.encoder = tiktoken.get_encoding(encoding_name)

    def serialize_prompt(self, static_instructions: str, user_query: str) -> str:
        aligned_static = static_instructions
        # Loop and append single-token word " pad" until aligned
        while len(self.encoder.encode(aligned_static)) % self.block_size != 0:
            aligned_static += " pad"
        return f"{aligned_static}\n### USER QUERY ###\n{user_query}"

# ==========================================
# Strategy 3: BM25 Sentence Compactor
# ==========================================

class BM25SentenceCompactor:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b\w+\b', text.lower())

    def compact(self, context: str, query: str, compression_ratio: float = 0.50) -> str:
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', context) if s.strip()]
        if not sentences:
            return context
        tokenized_sentences = [self._tokenize(s) for s in sentences]
        doc_lengths = [len(s) for s in tokenized_sentences]
        avg_doc_len = sum(doc_lengths) / len(sentences) if sentences else 0
        dfs = {}
        tfs = []
        for doc in tokenized_sentences:
            tf = {}
            for token in doc:
                tf[token] = tf.get(token, 0) + 1
            tfs.append(tf)
            for token in set(doc):
                dfs[token] = dfs.get(token, 0) + 1
        num_docs = len(sentences)
        idfs = {}
        for token, df in dfs.items():
            idfs[token] = math.log((num_docs - df + 0.5) / (df + 0.5) + 1.0)
        query_tokens = self._tokenize(query)
        scored_sentences = []
        for idx, tf_map in enumerate(tfs):
            score = 0.0
            doc_len = doc_lengths[idx]
            for token in query_tokens:
                if token in tf_map:
                    tf = tf_map[token]
                    idf = idfs.get(token, 0.0)
                    numerator = tf * (self.k1 + 1)
                    denominator = tf + self.k1 * (1 - self.b + self.b * (doc_len / avg_doc_len))
                    score += idf * (numerator / denominator)
            scored_sentences.append((idx, score))
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        keep_count = max(1, int(len(sentences) * compression_ratio))
        best_indices = sorted([idx for idx, _ in scored_sentences[:keep_count]])
        return " ".join([sentences[i] for i in best_indices])

# ==========================================
# Strategy 4: Speculative Gateway
# ==========================================

class SpeculativeGateway:
    def __init__(self):
        self.draft_cost = 0.00015
        self.heavy_cost = 0.01500
        self.total_expenditure = 0.0

    async def _call_draft_model(self, prompt: str) -> str:
        await asyncio.sleep(0.01)
        if "generate syntax error" in prompt.lower():
            return "def calculate_sum(a, b):\n    return a + b\n  invalid_indentation"
        return "def calculate_sum(a, b):\n    return a + b"

    async def _call_heavy_model(self, prompt: str) -> str:
        await asyncio.sleep(0.05)
        return "def calculate_sum(a, b):\n    \"\"\"Calculates sum safely.\"\"\"\n    return a + b"

    def _verify_syntax(self, code: str) -> bool:
        try:
            ast.parse(code)
            return True
        except SyntaxError:
            return False

    async def generate_code(self, prompt: str) -> Tuple[str, str, float]:
        start = time.time()
        self.total_expenditure += self.draft_cost
        draft_code = await self._call_draft_model(prompt)
        if self._verify_syntax(draft_code):
            return "DRAFT_MODEL", draft_code, time.time() - start
        print(" -> [Speculation Failed] Escalating...")
        self.total_expenditure += self.heavy_cost
        heavy_code = await self._call_heavy_model(prompt)
        return "HEAVY_MODEL", heavy_code, time.time() - start

# ==========================================
# Strategy 5: Mock LLM Engine Profiler
# ==========================================

class MockLLMEngine:
    def __init__(self, max_concurrency: int = 2, base_ttft: float = 0.1, itl: float = 0.015):
        self.max_concurrency = max_concurrency
        self.base_ttft = base_ttft
        self.itl = itl
        self.active_slots = asyncio.Semaphore(max_concurrency)

    async def generate(self, input_tokens: int, max_output_tokens: int) -> Dict[str, Any]:
        start_queue = time.time()
        async with self.active_slots:
            queue_time = time.time() - start_queue
            prefill_duration = self.base_ttft + (input_tokens * 0.0001)
            await asyncio.sleep(prefill_duration)
            ttft = time.time() - start_queue
            actual_output_tokens = random.randint(int(max_output_tokens * 0.5), max_output_tokens)
            decode_duration = actual_output_tokens * self.itl
            await asyncio.sleep(decode_duration)
            total_time = time.time() - start_queue
            return {
                "queue_latency_ms": queue_time * 1000,
                "ttft_ms": ttft * 1000,
                "generation_time_ms": (total_time - ttft) * 1000,
                "total_latency_ms": total_time * 1000,
                "tokens_generated": actual_output_tokens
            }

# ==========================================
# Verification Main Runner
# ==========================================

async def test_all():
    print("=== TESTING STRATEGY 1: Token-Aware Multi-Tier Router ===")
    primary = TokenBucket("gpt-4o-primary", tpm=2000, rpm=10)
    fallback = TokenBucket("llama-3-fallback", tpm=5000, rpm=30)
    router = TokenAwareRouter(primary, fallback)
    tasks = [router.route_request("Hello world corporate task.", 100) for _ in range(3)]
    results = await asyncio.gather(*tasks)
    for r in results:
         print(f"Routed to: {r[0]}, response len: {len(r[1])}")

    print("\n=== TESTING STRATEGY 2: Block-Padding Alignment ===")
    serializer = CachingPromptSerializer(block_size=16)
    sys_prompt = "You are a specialized support representative. Follow internal procedures."
    query = "What is the warranty policy?"
    aligned_prompt = serializer.serialize_prompt(sys_prompt, query)
    prefix = aligned_prompt.split("\n### USER QUERY ###")[0]
    tokenized_len = len(serializer.encoder.encode(prefix))
    print(f"Aligned static prefix token count: {tokenized_len} (Is multiple of 16? {tokenized_len % 16 == 0})")

    print("\n=== TESTING STRATEGY 3: BM25 Compactor ===")
    compactor = BM25SentenceCompactor()
    text = (
        "The server version is PostgreSQL 16.2. "
        "The office has blue chairs. "
        "The primary database port is 5432. "
        "Dogs are lovely pets."
    )
    res = compactor.compact(text, "What is the database port and server version?", compression_ratio=0.5)
    print("Compacted text:", res)

    print("\n=== TESTING STRATEGY 4: Speculative Gateway ===")
    gateway = SpeculativeGateway()
    source, code, t = await gateway.generate_code("Generate standard sum function.")
    print(f"Source: {source}, Latency: {t:.4f}s, Valid syntax: {gateway._verify_syntax(code)}")
    source, code, t = await gateway.generate_code("Generate standard sum function and generate syntax error.")
    print(f"Source: {source}, Latency: {t:.4f}s, Valid syntax: {gateway._verify_syntax(code)}")

    print("\n=== TESTING STRATEGY 5: Mock Engine Profiler ===")
    engine = MockLLMEngine(max_concurrency=2, base_ttft=0.01, itl=0.001)
    results = await asyncio.gather(
        engine.generate(100, 50),
        engine.generate(200, 50),
        engine.generate(300, 50)
    )
    for idx, stats in enumerate(results):
         print(f"Task {idx+1} -> TTFT: {stats['ttft_ms']:.1f}ms, Total: {stats['total_latency_ms']:.1f}ms, Queue: {stats['queue_latency_ms']:.1f}ms")

if __name__ == "__main__":
    asyncio.run(test_all())
