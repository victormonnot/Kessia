"""Auth-cookie helpers.

The refresh token is delivered in an httpOnly cookie scoped to the auth
endpoints, so JavaScript (and therefore XSS) can't read it. A second,
JS-readable CSRF cookie backs a double-submit check: the SPA echoes its value in
the ``X-CSRFToken`` header on cookie-authenticated calls (refresh, logout), and
the server requires the two to match. A cross-site attacker can neither read the
cookie nor set the custom header (CORS preflight blocks it), so they can't forge
those requests.
"""

from __future__ import annotations

import secrets

from django.conf import settings
from django.utils.crypto import constant_time_compare
from rest_framework.exceptions import PermissionDenied

REFRESH_COOKIE = "kessia_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth/"
CSRF_COOKIE = "kessia_csrf"
CSRF_HEADER = "X-CSRFToken"


def _refresh_max_age() -> int:
    return int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())


def set_auth_cookies(response, refresh_token: str) -> None:
    """Attach the httpOnly refresh cookie and a fresh JS-readable CSRF cookie."""
    common = {
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": settings.AUTH_COOKIE_SAMESITE,
        "max_age": _refresh_max_age(),
    }
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        path=REFRESH_COOKIE_PATH,
        **common,
    )
    response.set_cookie(
        CSRF_COOKIE,
        secrets.token_urlsafe(32),
        httponly=False,
        path="/",
        **common,
    )


def clear_auth_cookies(response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH)
    response.delete_cookie(CSRF_COOKIE, path="/")


def check_csrf(request) -> None:
    """Double-submit check: header must be present and equal the CSRF cookie."""
    header = request.headers.get(CSRF_HEADER)
    cookie = request.COOKIES.get(CSRF_COOKIE)
    if not header or not cookie or not constant_time_compare(header, cookie):
        raise PermissionDenied("Échec de la vérification CSRF.")
