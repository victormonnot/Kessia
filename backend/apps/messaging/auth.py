"""WebSocket authentication via a JWT carried in the connection subprotocol.

The browser offers two subprotocols: the literal ``"access_token"`` and the JWT
itself. We read the token from ``scope["subprotocols"]`` (never the URL — a token
in the query string leaks into access logs), validate it, and attach the user.
"""

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def _get_user(user_id):
    try:
        return User.objects.get(pk=user_id, is_active=True)
    except User.DoesNotExist:
        return AnonymousUser()


def _token_from_subprotocols(subprotocols):
    # Convention: ["access_token", "<jwt>"].
    if subprotocols and len(subprotocols) >= 2 and subprotocols[0] == "access_token":
        return subprotocols[1]
    return None


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        token = _token_from_subprotocols(scope.get("subprotocols"))
        scope["user"] = AnonymousUser()
        if token:
            try:
                access = AccessToken(token)
                scope["user"] = await _get_user(access["user_id"])
            except TokenError:
                pass
        return await super().__call__(scope, receive, send)
