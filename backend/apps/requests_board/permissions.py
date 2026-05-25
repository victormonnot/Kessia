from rest_framework import permissions


class IsRequestOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.doctor_id == getattr(request.user, "id", None)


class IsProposalRequestOwner(permissions.BasePermission):
    """The doctor who owns the parent request."""

    def has_object_permission(self, request, view, obj):
        return obj.request.doctor_id == getattr(request.user, "id", None)


class IsProposalWriter(permissions.BasePermission):
    """The writer who authored the proposal."""

    def has_object_permission(self, request, view, obj):
        return obj.writer_id == getattr(request.user, "id", None)
