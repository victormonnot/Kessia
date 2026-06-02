from django.db import models


class StripeEvent(models.Model):
    """Log of processed Stripe webhook events, for idempotent handling.

    Stripe may deliver the same event more than once; recording the event id
    lets us no-op on replays so funds are never moved twice.
    """

    event_id = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=255)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-received_at",)

    def __str__(self) -> str:
        return f"{self.type} ({self.event_id})"
