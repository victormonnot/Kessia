"""Per-conversation WebSocket consumer.

Live delivery only: messages are written through the REST API (which validates,
persists and emails), and the view's ``post_message`` broadcasts to this
consumer's group. The consumer is therefore receive-and-forward; it does not
write to the database.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .models import Conversation


def conversation_group(conversation_id) -> str:
    return f"conversation_{conversation_id}"


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        if not await self._is_participant(user.id, self.conversation_id):
            await self.close()
            return

        self.group = conversation_group(self.conversation_id)
        await self.channel_layer.group_add(self.group, self.channel_name)
        # Echo back one of the offered subprotocols, as the browser requires.
        await self.accept(subprotocol="access_token")

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def chat_message(self, event):
        """Forward a broadcast message to the connected client."""
        await self.send_json(event["message"])

    @database_sync_to_async
    def _is_participant(self, user_id, conversation_id):
        conv = Conversation.objects.filter(pk=conversation_id).first()
        return bool(conv and user_id in (conv.user_low_id, conv.user_high_id))
