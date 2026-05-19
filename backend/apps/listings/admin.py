from django.contrib import admin

from .models import Listing


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("title", "writer", "specialty", "deliverable_type", "price", "is_published")
    list_filter = ("specialty", "deliverable_type", "is_published")
    search_fields = ("title", "description", "writer__email")
