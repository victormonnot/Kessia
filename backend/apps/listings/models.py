from django.conf import settings
from django.db import models

from apps.common.choices import DeliverableType, Specialty


class Listing(models.Model):
    writer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    specialty = models.CharField(max_length=32, choices=Specialty.choices)
    deliverable_type = models.CharField(max_length=32, choices=DeliverableType.choices)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    turnaround_days = models.PositiveIntegerField()
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("specialty",)),
            models.Index(fields=("deliverable_type",)),
        ]

    def __str__(self) -> str:
        return self.title
