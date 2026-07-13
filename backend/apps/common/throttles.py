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
    """Anti-bruteforce login throttle that counts only *failed* attempts.

    A successful login never counts, so many legitimate users behind one shared
    IP (e.g. a hospital) are not blocked. ``allow_request`` only checks the limit;
    the login views call ``record_failure`` when authentication fails.
    """

    scope = "auth-login"

    def allow_request(self, request, view):
        if self.rate is None:
            return True
        self.key = self.get_cache_key(request, view)
        if self.key is None:
            return True
        self.history = self.cache.get(self.key, [])
        self.now = self.timer()
        while self.history and self.history[-1] <= self.now - self.duration:
            self.history.pop()
        return len(self.history) < self.num_requests

    def record_failure(self, request):
        """Count one failed login against the client IP."""
        if self.rate is None:
            return
        key = self.get_cache_key(request, None)
        if key is None:
            return
        history = self.cache.get(key, [])
        now = self.timer()
        while history and history[-1] <= now - self.duration:
            history.pop()
        history.insert(0, now)
        self.cache.set(key, history, self.duration)


class RegisterThrottle(IPRateThrottle):
    scope = "auth-register"


class PasswordResetThrottle(IPRateThrottle):
    scope = "password-reset"


class EmailResendThrottle(UserRateThrottle):
    scope = "email-resend"


class EmailChangeThrottle(UserRateThrottle):
    scope = "email-change"


class MessageThrottle(UserRateThrottle):
    """Cap how fast a user can send chat messages, to curb spam/flooding and the
    DB writes, attachment storage and notification emails each send can trigger."""

    scope = "messaging"
