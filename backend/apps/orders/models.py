from django.conf import settings
from django.db import models


class Order(models.Model):
    """A paid engagement between a doctor and a writer.

    An order originates either from a listing purchase (``listing`` set) or from
    an accepted proposal on the requests board (``proposal`` set, ``listing``
    null). ``writer`` and ``amount`` are denormalised/snapshotted at creation so
    the engagement never depends on the live listing/proposal that spawned it.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        IN_PROGRESS = "in_progress", "In progress"
        DELIVERED = "delivered", "Delivered"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PROCESSING = "processing", "Processing"
        HELD = "held", "Held"
        RELEASED = "released", "Released"
        REFUNDED = "refunded", "Refunded"
        FAILED = "failed", "Failed"

    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
    )
    proposal = models.ForeignKey(
        "requests_board.Proposal",
        on_delete=models.PROTECT,
        related_name="orders",
        null=True,
        blank=True,
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders_placed",
    )
    writer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders_received",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
    )
    message = models.TextField(blank=True)

    # Money snapshot taken at order time (do not trust the live listing price).
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="EUR")

    # Stripe payment state (wired in the payments app).
    payment_status = models.CharField(
        max_length=16,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)
    stripe_transfer_id = models.CharField(max_length=255, blank=True)
    application_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Order #{self.pk} ({self.status})"


def deliverable_upload_path(instance: "Deliverable", filename: str) -> str:
    return f"deliverables/order_{instance.order_id}/{filename}"


class Deliverable(models.Model):
    """A finished-work file uploaded by the writer and downloadable by the doctor."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="deliverables",
    )
    file = models.FileField(upload_to=deliverable_upload_path)
    note = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-uploaded_at",)

    def __str__(self) -> str:
        return f"Deliverable #{self.pk} for order #{self.order_id}"
