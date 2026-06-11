from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsEmailVerified(BasePermission):
    """Gate write actions behind email confirmation.

    Read-only (safe) methods are always allowed, so unverified users keep full
    browse/read access — including reading conversations. Only writes
    (POST/PUT/PATCH/DELETE) are blocked until they confirm their address.
    """

    message = "Confirmez votre adresse e-mail pour effectuer cette action."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_email_verified)
