from django.conf import settings
from django.db import models

from apps.common.choices import Specialty


class Request(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="requests_posted",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    specialty = models.CharField(max_length=32, choices=Specialty.choices)
    deadline = models.DateField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.OPEN,
    )
    # Set when an admin takes the request down (policy violation).
    removed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("specialty",)), models.Index(fields=("status",))]

    def __str__(self) -> str:
        return self.title


class Proposal(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"

    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        related_name="proposals",
    )
    writer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="proposals_sent",
    )
    message = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("request", "writer"),
                name="unique_proposal_per_writer",
            )
        ]

    def __str__(self) -> str:
        return f"Proposal #{self.pk} on Request #{self.request_id}"
