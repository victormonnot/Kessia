from django.contrib import admin

from .models import Deliverable, Order, OrderAttachment


class DeliverableInline(admin.TabularInline):
    model = Deliverable
    extra = 0
    readonly_fields = ("uploaded_at",)


class OrderAttachmentInline(admin.TabularInline):
    model = OrderAttachment
    extra = 0
    readonly_fields = ("uploaded_at",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "listing",
        "proposal",
        "doctor",
        "writer",
        "status",
        "amount",
        "currency",
        "payment_status",
        "created_at",
    )
    list_filter = ("status", "payment_status", "currency")
    search_fields = (
        "doctor__email",
        "writer__email",
        "listing__title",
        "stripe_payment_intent_id",
    )
    readonly_fields = ("created_at", "updated_at")
    inlines = (DeliverableInline, OrderAttachmentInline)


@admin.register(Deliverable)
class DeliverableAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "file", "uploaded_at")
    search_fields = ("order__id",)
    readonly_fields = ("uploaded_at",)


@admin.register(OrderAttachment)
class OrderAttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "file", "uploaded_by", "uploaded_at")
    search_fields = ("order__id",)
    readonly_fields = ("uploaded_at",)
