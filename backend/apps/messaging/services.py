from apps.common.notifications import send_notification

from .models import Conversation, Message


def get_or_create_conversation(user_a, user_b, order=None) -> Conversation:
    """Return the (deduped) conversation for a pair, optionally scoped to an order."""
    low, high = sorted([user_a, user_b], key=lambda u: u.id)
    if order is not None:
        conversation, _ = Conversation.objects.get_or_create(
            order=order, defaults={"user_low": low, "user_high": high}
        )
        return conversation
    conversation, _ = Conversation.objects.get_or_create(
        user_low=low, user_high=high, order=None
    )
    return conversation


def post_message(conversation: Conversation, sender, body: str) -> Message:
    """Create a message and email the recipient on the first unread (no spam)."""
    recipient = conversation.other(sender)
    already_pending = (
        conversation.messages.filter(read_at__isnull=True)
        .exclude(sender=recipient)
        .exists()
    )
    message = Message.objects.create(conversation=conversation, sender=sender, body=body)
    if not already_pending:
        send_notification(
            "new_message",
            recipient.email,
            {
                "conversation": conversation,
                "sender_name": sender.get_full_name() or sender.email,
                "recipient_name": recipient.get_full_name() or recipient.email,
                "order": conversation.order,
            },
        )
    return message
