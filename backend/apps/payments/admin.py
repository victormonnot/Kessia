from django.contrib import admin

from .models import StripeEvent


@admin.register(StripeEvent)
class StripeEventAdmin(admin.ModelAdmin):
    list_display = ("event_id", "type", "received_at")
    list_filter = ("type",)
    search_fields = ("event_id", "type")
    readonly_fields = ("event_id", "type", "received_at")
