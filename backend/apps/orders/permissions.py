from rest_framework import permissions


class IsOrderParticipant(permissions.BasePermission):
    """Doctor who placed the order or the writer of the listing."""

    def has_object_permission(self, request, view, obj):
        user_id = getattr(request.user, "id", None)
        return user_id in (obj.doctor_id, obj.listing.writer_id)


class IsOrderWriter(permissions.BasePermission):
    """Only the listing's writer can mutate the order."""

    def has_object_permission(self, request, view, obj):
        return obj.listing.writer_id == getattr(request.user, "id", None)
