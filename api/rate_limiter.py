from __future__ import annotations

import os
import threading
import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse

_ENABLED: bool = os.environ.get("RATE_LIMIT_ENABLED", "true").lower() == "true"
_RPM_GLOBAL: int = int(os.environ.get("RATE_LIMIT_RPM", "600"))
_RPM_WRITE: int = int(os.environ.get("RATE_LIMIT_WRITE_RPM", "30"))
_WINDOW: float = 60.0

_WRITE_METHODS = {"POST", "PUT", "DELETE"}
_EXEMPT_PREFIXES = ("/events/stream", "/static")
_EXEMPT_PATHS = {"/", "/demo", "/metrics"}

_lock = threading.Lock()
_global_windows: dict[str, deque[float]] = defaultdict(deque)
_write_windows: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_window(window: deque[float], limit: int, now: float) -> tuple[bool, int]:
    while window and now - window[0] >= _WINDOW:
        window.popleft()
    if len(window) >= limit:
        retry_after = max(1, int(_WINDOW - (now - window[0])) + 1)
        return True, retry_after
    window.append(now)
    return False, 0


def _is_exempt_path(path: str) -> bool:
    return path in _EXEMPT_PATHS or any(path.startswith(prefix) for prefix in _EXEMPT_PREFIXES)


def is_rate_limited(ip: str, method: str, path: str = "") -> tuple[bool, int]:
    if not _ENABLED:
        return False, 0
    if _is_exempt_path(path):
        return False, 0
    now = time.monotonic()
    with _lock:
        limited, retry = _check_window(_global_windows[ip], _RPM_GLOBAL, now)
        if limited:
            return True, retry
        if method in _WRITE_METHODS:
            limited, retry = _check_window(_write_windows[ip], _RPM_WRITE, now)
            if limited:
                return True, retry
    return False, 0


class RateLimitMiddleware:
    def __init__(self, app: object) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: object, send: object) -> None:
        if not _ENABLED or scope.get("type") != "http":
            await self.app(scope, receive, send)  # type: ignore[misc]
            return

        request = Request(scope)
        limited, retry_after = is_rate_limited(
            _client_ip(request), request.method, request.url.path
        )
        if limited:
            try:
                from . import metrics  # noqa: PLC0415

                metrics.record_rate_limited(request.method)
            except Exception:
                pass
            response = JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Too many requests."},
                headers={"Retry-After": str(retry_after)},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)  # type: ignore[misc]
