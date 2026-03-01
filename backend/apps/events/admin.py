"""Admin registration for events models."""

from django.contrib import admin

from .models import Event, EventCategory, EventInterest, EventLifecycleTransition




@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    """Admin for EventCategory."""

    list_display = ["name", "slug", "icon"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin for Event."""

    list_display = [
        "title",
        "host",
        "category",
        "lifecycle_state",
        "start_time",


        "interest_count",
        "ticket_count",
    ]
    list_filter = ["lifecycle_state", "category"]


    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["interest_count", "ticket_count", "created_at", "updated_at"]


@admin.register(EventInterest)
class EventInterestAdmin(admin.ModelAdmin):
    """Admin for EventInterest."""

    list_display = ["user", "event", "created_at"]
    list_filter = ["created_at"]


@admin.register(EventLifecycleTransition)
class EventLifecycleTransitionAdmin(admin.ModelAdmin):
    """Admin for lifecycle transition audit records."""

    list_display = ["event", "from_state", "to_state", "actor", "created_at"]
    list_filter = ["from_state", "to_state", "created_at"]
    search_fields = ["event__title", "actor__username", "reason"]
    readonly_fields = [
        "event",
        "actor",
        "from_state",
        "to_state",
        "reason",
        "metadata",
        "created_at",
    ]

