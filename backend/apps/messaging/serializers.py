import os

from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    attachment_name = serializers.SerializerMethodField()
    attachment_size = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "conversation",
            "sender",
            "body",
            "attachment_name",
            "attachment_size",
            "created_at",
            "read_at",
        )
        read_only_fields = fields

    def get_attachment_name(self, obj):
        return os.path.basename(obj.attachment.name) if obj.attachment else None

    def get_attachment_size(self, obj):
        return obj.attachment.size if obj.attachment else None


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "order",
            "other_user",
            "last_message",
            "unread_count",
            "created_at",
        )
        read_only_fields = fields

    def get_other_user(self, obj):
        return UserPublicSerializer(
            obj.other(self.context["request"].user), context=self.context
        ).data

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg is None:
            return None
        return {
            "body": msg.body or ("Pièce jointe" if msg.attachment else ""),
            "created_at": msg.created_at,
            "sender_id": msg.sender_id,
        }

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(read_at__isnull=True).exclude(sender=user).count()
