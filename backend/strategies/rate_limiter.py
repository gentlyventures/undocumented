import asyncio
import time
import threading
from typing import Optional

class TokenBucketRateLimiter:
    """
    A thread-safe and async-safe rate limiter implementing the token bucket algorithm
    with instantaneous reservation. It tracks both RPM (Requests Per Minute) and
    TPM (Tokens Per Minute) dynamically.
    """
    def __init__(self, rpm_limit: Optional[float] = None, tpm_limit: Optional[float] = None):
        self.rpm_limit = rpm_limit if rpm_limit and rpm_limit > 0 else None
        self.tpm_limit = tpm_limit if tpm_limit and tpm_limit > 0 else None
        
        self._lock = threading.Lock()
        
        self.last_update = time.time()
        self.request_tokens = self.rpm_limit if self.rpm_limit else 0.0
        self.token_tokens = self.tpm_limit if self.tpm_limit else 0.0

    def _refill(self, now: float):
        elapsed = now - self.last_update
        self.last_update = now
        
        if self.rpm_limit:
            self.request_tokens = min(self.rpm_limit, self.request_tokens + elapsed * (self.rpm_limit / 60.0))
        if self.tpm_limit:
            self.token_tokens = min(self.tpm_limit, self.token_tokens + elapsed * (self.tpm_limit / 60.0))

    async def acquire(self, tokens: int = 0):
        """
        Blocks asynchronously until 1 request slot and the specified number of tokens
        are available.
        """
        wait_time = 0.0
        
        with self._lock:
            now = time.time()
            self._refill(now)
            
            # Consume request token
            if self.rpm_limit:
                self.request_tokens -= 1.0
                if self.request_tokens < 0:
                    wait_time = max(wait_time, -self.request_tokens / (self.rpm_limit / 60.0))
            
            # Consume content tokens
            if self.tpm_limit and tokens > 0:
                # Cap requested tokens to limit to prevent permanent deadlock
                requested_tokens = min(tokens, self.tpm_limit)
                self.token_tokens -= requested_tokens
                if self.token_tokens < 0:
                    wait_time = max(wait_time, -self.token_tokens / (self.tpm_limit / 60.0))
                    
        if wait_time > 0:
            await asyncio.sleep(wait_time)
