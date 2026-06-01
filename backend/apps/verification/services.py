from django.utils import timezone

from .models import VerificationRequest


def approve(verification: VerificationRequest, reviewer) -> None:
    """Approve a request and flip the writer's verified flag."""
    verification.status = VerificationRequest.Status.APPROVED
    verification.reviewed_by = reviewer
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])
    writer = verification.writer
    writer.is_verified = True
    writer.save(update_fields=["is_verified"])


def reject(verification: VerificationRequest, reviewer) -> None:
    verification.status = VerificationRequest.Status.REJECTED
    verification.reviewed_by = reviewer
    verification.reviewed_at = timezone.now()
    verification.save(update_fields=["status", "reviewed_by", "reviewed_at", "updated_at"])
