from django.contrib import admin

from .models import AuditLog, Report


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "target_type", "target_id")
    list_filter = ("action", "target_type")
    search_fields = ("action", "target_id", "actor__email")
    readonly_fields = ("actor", "action", "target_type", "target_id", "detail", "created_at")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("created_at", "reporter", "target_type", "target_id", "status")
    list_filter = ("status", "target_type")
    search_fields = ("reporter__email", "reason")
