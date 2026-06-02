from django.conf import settings
from django.db import models


def credential_upload_path(instance: "VerificationRequest", filename: str) -> str:
    return f"verification/writer_{instance.writer_id}/{filename}"


class VerificationRequest(models.Model):
    """A writer's request to be verified. Approval is an admin-gated flag that
    flips ``User.is_verified`` — there is no automated credential checking."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    writer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_requests",
    )
    credentials = models.TextField()
    document = models.FileField(upload_to=credential_upload_path, null=True, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Verification #{self.pk} for {self.writer_id} ({self.status})"
