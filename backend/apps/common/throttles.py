"""Rate limits for abuse-prone endpoints (email spam, brute force).

Rates live in ``REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`` keyed by each
throttle's ``scope``. Counters use the default Django cache (per-process LocMem
here — fine for a single instance; swap the cache for Redis if we ever scale
out). Behind Render's proxy, ``NUM_PROXIES`` (set in prod settings) makes DRF
read the real client IP from X-Forwarded-For instead of the proxy's address.
"""

from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle


class IPRateThrottle(SimpleRateThrottle):
    """Throttle by client IP for everyone (AnonRateThrottle skips logged-in
    users, which would let an authenticated account bypass the limit)."""

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class LoginThrottle(IPRateThrottle):
    scope = "auth-login"


class RegisterThrottle(IPRateThrottle):
    scope = "auth-register"


class PasswordResetThrottle(IPRateThrottle):
    scope = "password-reset"


class EmailResendThrottle(UserRateThrottle):
    scope = "email-resend"


class EmailChangeThrottle(UserRateThrottle):
    scope = "email-change"
