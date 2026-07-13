from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Append-only trail of moderator actions, for accountability.

    A powerful owner-admin can suspend users, take down content and move money;
    every such action is recorded here (who, what, on which target, when).
    """

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="+",
    )
    action = models.CharField(max_length=64)  # e.g. "user.suspend", "listing.remove"
    target_type = models.CharField(max_length=32, blank=True)  # e.g. "user", "order"
    target_id = models.CharField(max_length=64, blank=True)
    detail = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.action} by {self.actor_id} -> {self.target_type}#{self.target_id}"


class Report(models.Model):
    """A user-submitted flag against content or another user, worked by an admin."""

    class Target(models.TextChoices):
        LISTING = "listing", "Annonce"
        REQUEST = "request", "Demande"
        REVIEW = "review", "Avis"
        USER = "user", "Utilisateur"

    class Status(models.TextChoices):
        OPEN = "open", "Ouvert"
        RESOLVED = "resolved", "Résolu"
        DISMISSED = "dismissed", "Rejeté"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_filed",
    )
    target_type = models.CharField(max_length=16, choices=Target.choices)
    target_id = models.PositiveIntegerField()
    reason = models.TextField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Report #{self.pk} on {self.target_type}#{self.target_id} ({self.status})"
