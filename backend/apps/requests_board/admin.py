from django.contrib import admin

from .models import Proposal, Request


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ("title", "doctor", "specialty", "deadline", "budget", "status")
    list_filter = ("specialty", "status")
    search_fields = ("title", "description", "doctor__email")


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ("id", "request", "writer", "price", "status")
    list_filter = ("status",)
    search_fields = ("request__title", "writer__email")
