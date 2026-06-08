import json
import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.renderers import JSONRenderer

from apps.common.notifications import send_notification

from .consumers import conversation_group
from .models import Conversation, Message
from .serializers import MessageSerializer

logger = logging.getLogger(__name__)


def broadcast_message(conversation: Conversation, message: Message) -> None:
    """Push a newly created message to the conversation's WebSocket group."""
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    payload = json.loads(JSONRenderer().render(MessageSerializer(message).data))
    try:
        async_to_sync(channel_layer.group_send)(
            conversation_group(conversation.id),
            {"type": "chat.message", "message": payload},
        )
    except Exception:  # pragma: no cover - never let delivery break the write
        logger.exception("Failed to broadcast message %s", message.id)


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


def post_message(conversation: Conversation, sender, body: str, attachment=None) -> Message:
    """Create a message and email the recipient on the first unread (no spam)."""
    recipient = conversation.other(sender)
    already_pending = (
        conversation.messages.filter(read_at__isnull=True)
        .exclude(sender=recipient)
        .exists()
    )
    message = Message.objects.create(
        conversation=conversation, sender=sender, body=body, attachment=attachment
    )
    broadcast_message(conversation, message)
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
