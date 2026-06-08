from django.conf import settings
from django.db import models


class Conversation(models.Model):
    """A 1-to-1 conversation between two users, optionally about an order.

    The pair is stored canonically (``user_low.id < user_high.id``) so a thread
    is deduped regardless of who starts it. Two partial-unique constraints keep
    exactly one pre-sales thread per pair and one thread per order.
    """

    user_low = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    user_high = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+"
    )
    order = models.ForeignKey(
        "orders.Order",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user_low", "user_high"],
                condition=models.Q(order__isnull=True),
                name="uniq_presales_conversation",
            ),
            models.UniqueConstraint(
                fields=["order"],
                condition=models.Q(order__isnull=False),
                name="uniq_order_conversation",
            ),
        ]

    def other(self, user):
        return self.user_high if user.id == self.user_low_id else self.user_low

    def has_participant(self, user) -> bool:
        return getattr(user, "id", None) in (self.user_low_id, self.user_high_id)

    def __str__(self) -> str:
        return f"Conversation #{self.pk}"


def message_attachment_path(instance: "Message", filename: str) -> str:
    return f"chat/conversation_{instance.conversation_id}/{filename}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    # A message carries text, a file attachment, or both (at least one required,
    # enforced at the API layer).
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to=message_attachment_path, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"Message #{self.pk} in conversation #{self.conversation_id}"
