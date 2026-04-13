import time
import re
import hashlib
import ipaddress
from collections import defaultdict
from threading import Lock
from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


# ─────────────────────────────────────────────
# IN-MEMORY RATE LIMITER (thread-safe)
# ─────────────────────────────────────────────

class RateLimitStore:
    def __init__(self):
        self._data: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._data[key]
            timestamps[:] = [t for t in timestamps if t > cutoff]
            if len(timestamps) >= max_requests:
                return False
            timestamps.append(now)
            return True

    def get_retry_after(self, key: str, window_seconds: int) -> int:
        now = time.time()
        cutoff = now - window_seconds
        with self._lock:
            timestamps = self._data[key]
            valid = [t for t in timestamps if t > cutoff]
            if not valid:
                return 0
            oldest = min(valid)
            return max(0, int(window_seconds - (now - oldest)) + 1)

    def ban_key(self, key: str, duration_seconds: int):
        future = time.time() + duration_seconds
        with self._lock:
            count = 10_000
            self._data[key] = [future - i * 0.001 for i in range(count)]

    def clear_key(self, key: str):
        with self._lock:
            self._data.pop(key, None)


_rate_store = RateLimitStore()


# ─────────────────────────────────────────────
# BRUTE-FORCE TRACKER (login attempts per email)
# ─────────────────────────────────────────────

class BruteForceTracker:
    MAX_ATTEMPTS = 5
    LOCKOUT_SECONDS = 900

    def __init__(self):
        self._attempts: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _key(self, identifier: str) -> str:
        return hashlib.sha256(identifier.lower().encode()).hexdigest()[:32]

    def record_failure(self, identifier: str):
        k = self._key(identifier)
        now = time.time()
        with self._lock:
            self._attempts[k].append(now)

    def is_locked(self, identifier: str) -> bool:
        k = self._key(identifier)
        now = time.time()
        cutoff = now - self.LOCKOUT_SECONDS
        with self._lock:
            recent = [t for t in self._attempts[k] if t > cutoff]
            self._attempts[k] = recent
            return len(recent) >= self.MAX_ATTEMPTS

    def reset(self, identifier: str):
        k = self._key(identifier)
        with self._lock:
            self._attempts.pop(k, None)

    def lockout_seconds_remaining(self, identifier: str) -> int:
        k = self._key(identifier)
        now = time.time()
        cutoff = now - self.LOCKOUT_SECONDS
        with self._lock:
            recent = sorted([t for t in self._attempts[k] if t > cutoff])
            if len(recent) < self.MAX_ATTEMPTS:
                return 0
            oldest_relevant = recent[-self.MAX_ATTEMPTS]
            remaining = int(self.LOCKOUT_SECONDS - (now - oldest_relevant))
            return max(0, remaining)


brute_force_tracker = BruteForceTracker()


# ─────────────────────────────────────────────
# RATE LIMIT RULES
# ─────────────────────────────────────────────

RATE_LIMIT_RULES: list[tuple[str, int, int]] = [
    ("/api/auth/signin",        5,   60),
    ("/api/auth/signup",        3,   60),
    ("/api/chat/message",       30,  60),
    ("/api/advice/generate",    10,  60),
    ("/api/medication/generate", 10, 60),
    ("/api/appointments/book",   5,  60),
    ("/api/chat/translate",     20,  60),
]


def _match_rule(path: str) -> Optional[tuple[int, int]]:
    for prefix, max_req, window in RATE_LIMIT_RULES:
        if path.startswith(prefix):
            return max_req, window
    return None


def _client_key(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"
    try:
        ipaddress.ip_address(ip)
    except ValueError:
        ip = "unknown"
    path = request.url.path
    return f"rl:{ip}:{path}"


# ─────────────────────────────────────────────
# SECURITY HEADERS MIDDLEWARE
# ─────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )
        return response


# ─────────────────────────────────────────────
# RATE LIMITING MIDDLEWARE
# ─────────────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        rule = _match_rule(path)
        if rule is None:
            return await call_next(request)

        max_req, window = rule
        key = _client_key(request)

        if not _rate_store.is_allowed(key, max_req, window):
            retry_after = _rate_store.get_retry_after(key, window)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please slow down.",
                    "retry_after_seconds": retry_after,
                },
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)


# ─────────────────────────────────────────────
# INPUT SANITISATION
# ─────────────────────────────────────────────

_SQL_INJECTION_PATTERNS = re.compile(
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|--|;|/\*|\*/)",
    re.IGNORECASE,
)

_XSS_PATTERNS = re.compile(
    r"(<script|javascript:|on\w+=|<iframe|<object|<embed|<link\s+rel)",
    re.IGNORECASE,
)


def sanitise_text(text: str, field_name: str = "input") -> str:
    if not isinstance(text, str):
        return text
    if _SQL_INJECTION_PATTERNS.search(text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid characters detected in {field_name}.",
        )
    if _XSS_PATTERNS.search(text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content detected in {field_name}.",
        )
    return text.strip()


def sanitise_email(email: str) -> str:
    email = email.strip().lower()
    pattern = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
    if not pattern.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format.",
        )
    return email


def sanitise_password(password: str) -> str:
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters.",
        )
    if len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password too long.",
        )
    return password


# ─────────────────────────────────────────────
# OWNERSHIP GUARD (IDOR prevention)
# ─────────────────────────────────────────────

def assert_owns_resource(requesting_user_id: str, resource_owner_id: str, resource_name: str = "resource"):
    if str(requesting_user_id) != str(resource_owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: you do not own this {resource_name}.",
        )


# ─────────────────────────────────────────────
# SUSPICIOUS ACTIVITY LOGGER
# ─────────────────────────────────────────────

import logging

_security_logger = logging.getLogger("security")
_security_logger.setLevel(logging.WARNING)

_handler = logging.StreamHandler()
_handler.setFormatter(
    logging.Formatter("%(asctime)s [SECURITY] %(levelname)s: %(message)s")
)
_security_logger.addHandler(_handler)


def log_security_event(event_type: str, detail: str, request: Optional[Request] = None):
    ip = "unknown"
    path = "unknown"
    if request:
        forwarded = request.headers.get("X-Forwarded-For", "")
        ip = forwarded.split(",")[0].strip() if forwarded else (
            request.client.host if request.client else "unknown"
        )
        path = request.url.path
    _security_logger.warning(f"[{event_type}] ip={ip} path={path} detail={detail}")


# ─────────────────────────────────────────────
# ACCOUNT ISOLATION CHECKER
# ─────────────────────────────────────────────

def verify_resource_ownership(user_id: str, resource_user_id: str):
    if str(user_id) != str(resource_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this resource.",
        )
