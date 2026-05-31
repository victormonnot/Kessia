from rest_framework import permissions


class IsOrderParticipant(permissions.BasePermission):
    """The doctor who placed the order or the writer fulfilling it."""

    def has_object_permission(self, request, view, obj):
        user_id = getattr(request.user, "id", None)
        return user_id in (obj.doctor_id, obj.writer_id)


class IsOrderWriter(permissions.BasePermission):
    """Only the writer fulfilling the order can act as the writer."""

    def has_object_permission(self, request, view, obj):
        return obj.writer_id == getattr(request.user, "id", None)
