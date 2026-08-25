import time
from collections import defaultdict
from threading import Lock
from fastapi import Request, HTTPException, status
from src.config import settings

class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding window rate limiter."""
    def __init__(self, max_requests: int = settings.SEARCH_RATE_LIMIT_MAX_REQUESTS, window_seconds: int = settings.SEARCH_RATE_LIMIT_WINDOW_SECONDS):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def __call__(self, request: Request):
        client_ip = self._get_client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        with self.lock:
            timestamps = [t for t in self.requests[client_ip] if t > cutoff]
            
            if len(timestamps) >= self.max_requests:
                retry_after = int(timestamps[0] - cutoff) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many search requests. Please slow down.",
                    headers={"Retry-After": str(max(1, retry_after))}
                )

            timestamps.append(now)
            self.requests[client_ip] = timestamps

search_rate_limiter = SlidingWindowRateLimiter(
    max_requests=settings.SEARCH_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.SEARCH_RATE_LIMIT_WINDOW_SECONDS
)
