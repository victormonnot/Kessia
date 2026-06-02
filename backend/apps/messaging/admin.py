from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user_low", "user_high", "order", "created_at")
    search_fields = ("user_low__email", "user_high__email")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "created_at", "read_at")
    search_fields = ("sender__email", "body")
    readonly_fields = ("created_at",)
