from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "writer", "doctor", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("writer__email", "doctor__email", "comment")
    readonly_fields = ("created_at",)
