from rest_framework import permissions


class IsWriter(permissions.BasePermission):
    """Allow only users with the writer flag."""

    message = "Only writers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_writer
        )


class IsListingOwner(permissions.BasePermission):
    """Allow only the listing's writer to mutate it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.writer_id == getattr(request.user, "id", None)
