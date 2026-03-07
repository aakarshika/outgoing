"""Admin registration for events models."""

from django.contrib import admin

from .models import (
    Event,
    EventCategory,
    EventHighlight,
    EventInterest,
    EventLifecycleTransition,
    EventMedia,
    EventReview,
    EventReviewMedia,
    EventSeries,
    EventSeriesNeedTemplate,
    EventVendorReview,
    EventView,
)


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    """Admin for EventCategory."""

    list_display = ["name", "slug", "icon"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(EventSeries)
class EventSeriesAdmin(admin.ModelAdmin):
    """Admin for EventSeries."""

    list_display = ["name", "host", "recurrence_rule", "created_at"]
    search_fields = ["name", "description"]


@admin.register(EventSeriesNeedTemplate)
class EventSeriesNeedTemplateAdmin(admin.ModelAdmin):
    """Admin for EventSeriesNeedTemplate."""

    list_display = ["series", "title", "category", "criticality"]
    list_filter = ["category", "criticality"]


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


@admin.register(EventMedia)
class EventMediaAdmin(admin.ModelAdmin):
    """Admin for EventMedia."""

    list_display = ["event", "media_type", "category", "created_at"]
    list_filter = ["media_type", "category"]


@admin.register(EventHighlight)
class EventHighlightAdmin(admin.ModelAdmin):
    """Admin for EventHighlight."""

    list_display = ["event", "author", "role", "moderation_status", "created_at"]
    list_filter = ["role", "moderation_status"]


@admin.register(EventReview)
class EventReviewAdmin(admin.ModelAdmin):
    """Admin for EventReview."""

    list_display = ["event", "reviewer", "rating", "is_public", "created_at"]
    list_filter = ["rating", "is_public"]


@admin.register(EventReviewMedia)
class EventReviewMediaAdmin(admin.ModelAdmin):
    """Admin for EventReviewMedia."""

    list_display = ["review", "created_at"]


@admin.register(EventVendorReview)
class EventVendorReviewAdmin(admin.ModelAdmin):
    """Admin for EventVendorReview."""

    list_display = ["event_review", "vendor", "rating", "created_at"]
    list_filter = ["rating"]


@admin.register(EventView)
class EventViewAdmin(admin.ModelAdmin):
    """Admin for EventView."""

    list_display = ["event", "user", "last_viewed_at"]


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
