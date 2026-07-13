"""Helpers shared by the admin endpoints."""

from __future__ import annotations

from .models import AuditLog


def log_action(actor, action: str, target_type: str = "", target_id="", **detail) -> None:
    """Record a moderator action in the audit trail (never raises into callers)."""
    AuditLog.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id != "" else "",
        detail=detail,
    )
