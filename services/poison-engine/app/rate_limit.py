from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Small in-process limiter for the MVP; use a shared Redis limiter when horizontally scaled."""

    def __init__(self, app: object, requests_per_minute: int = 10) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self.limit = requests_per_minute
        self.window_seconds = 60.0
        self.requests: dict[str, deque[float]] = defaultdict(deque)
        self.lock = Lock()

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path == "/health":
            return await call_next(request)
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        with self.lock:
            timestamps = self.requests[client_ip]
            while timestamps and now - timestamps[0] >= self.window_seconds:
                timestamps.popleft()
            if len(timestamps) >= self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Terlalu banyak permintaan. Coba lagi dalam satu menit."},
                    headers={"Retry-After": "60"},
                )
            timestamps.append(now)
        return await call_next(request)
