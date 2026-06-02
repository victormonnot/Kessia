from django.contrib import admin

from . import services
from .models import VerificationRequest


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "writer", "status", "created_at", "reviewed_at", "reviewed_by")
    list_filter = ("status",)
    search_fields = ("writer__email", "credentials")
    readonly_fields = ("created_at", "updated_at", "reviewed_at", "reviewed_by")
    actions = ("approve_requests", "reject_requests")

    @admin.action(description="Approuver et vérifier le rédacteur")
    def approve_requests(self, request, queryset):
        for verification in queryset:
            services.approve(verification, request.user)
        self.message_user(request, f"{queryset.count()} demande(s) approuvée(s).")

    @admin.action(description="Rejeter la demande")
    def reject_requests(self, request, queryset):
        for verification in queryset:
            services.reject(verification, request.user)
        self.message_user(request, f"{queryset.count()} demande(s) rejetée(s).")
