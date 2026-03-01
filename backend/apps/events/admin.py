"""Admin registration for events models."""

from django.contrib import admin

from .models import Event, EventCategory, EventInterest


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    """Admin for EventCategory."""

    list_display = ["name", "slug", "icon"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin for Event."""

    list_display = ["title", "host", "category", "status", "start_time", "interest_count", "ticket_count"]
    list_filter = ["status", "category"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["interest_count", "ticket_count", "created_at", "updated_at"]


@admin.register(EventInterest)
class EventInterestAdmin(admin.ModelAdmin):
    """Admin for EventInterest."""

    list_display = ["user", "event", "created_at"]
    list_filter = ["created_at"]
