import time
from collections import defaultdict
from threading import Lock
from fastapi import Request, HTTPException, status
from src.config import settings

class RateLimiter:
    """Unified thread-safe in-memory sliding window rate limiter supporting authenticated tiers."""
    def __init__(
        self,
        anon_limit: int,
        auth_limit: int = None,
        window_seconds: int = 60,
        message: str = None,
    ):
        self.anon_limit = anon_limit
        self.auth_limit = auth_limit or anon_limit
        self.window_seconds = window_seconds
        self.message = message
        self.requests = defaultdict(list)
        self.lock = Lock()

    def __call__(self, request: Request):
        user_id = request.headers.get("X-User-Id")
        if user_id:
            key = f"user:{user_id}"
            limit = self.auth_limit
            msg = self.message or f"Daily limit of {limit} requests per 24 hours reached."
        else:
            forwarded = request.headers.get("X-Forwarded-For", "")
            client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
            key = f"ip:{client_ip}"
            limit = self.anon_limit
            msg = self.message or f"Guest limit of {limit} requests per 24 hours reached. Sign in for {self.auth_limit} requests per day."

        now = time.time()
        cutoff = now - self.window_seconds

        with self.lock:
            history = [t for t in self.requests[key] if t > cutoff]
            if len(history) >= limit:
                retry_after = int(history[0] - cutoff) + 1
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=msg,
                    headers={"Retry-After": str(max(1, retry_after))},
                )
            history.append(now)
            self.requests[key] = history

# Rate Limiter Instances
search_rate_limiter = RateLimiter(
    anon_limit=settings.SEARCH_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.SEARCH_RATE_LIMIT_WINDOW_SECONDS,
    message="Too many search requests. Please slow down.",
)

chat_rate_limiter = RateLimiter(
    anon_limit=settings.CHAT_ANON_RATE_LIMIT_MAX_REQUESTS,
    auth_limit=settings.CHAT_AUTH_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.CHAT_RATE_LIMIT_WINDOW_SECONDS,
)

questions_rate_limiter = RateLimiter(
    anon_limit=settings.QUESTIONS_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.QUESTIONS_RATE_LIMIT_WINDOW_SECONDS,
    message="Too many question requests. Please slow down.",
)

solutions_generate_rate_limiter = RateLimiter(
    anon_limit=settings.SOLUTIONS_GENERATE_ANON_RATE_LIMIT_MAX_REQUESTS,
    auth_limit=settings.SOLUTIONS_GENERATE_AUTH_RATE_LIMIT_MAX_REQUESTS,
    window_seconds=settings.SOLUTIONS_GENERATE_RATE_LIMIT_WINDOW_SECONDS,
    message=f"Solution plan generation limit reached ({settings.SOLUTIONS_GENERATE_ANON_RATE_LIMIT_MAX_REQUESTS} for guests, {settings.SOLUTIONS_GENERATE_AUTH_RATE_LIMIT_MAX_REQUESTS} for signed-in users per 24 hours). Sign in for more generations or try again later.",
)
