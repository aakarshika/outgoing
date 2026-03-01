"""Admin registration for request models."""

from django.contrib import admin

from .models import EventRequest, RequestUpvote


@admin.register(EventRequest)
class EventRequestAdmin(admin.ModelAdmin):
    """Admin for EventRequest."""

    list_display = ["title", "requester", "category", "status", "upvote_count", "created_at"]
    list_filter = ["status", "category"]
    search_fields = ["title", "description"]


@admin.register(RequestUpvote)
class RequestUpvoteAdmin(admin.ModelAdmin):
    """Admin for RequestUpvote."""

    list_display = ["user", "request", "created_at"]
