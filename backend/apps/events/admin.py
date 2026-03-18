"""Admin registration for events models."""

from django.contrib import admin

from .models import (
    Event,
    EventCategory,
    EventHighlight,
    EventHighlightComment,
    EventHighlightLike,
    EventInterest,
    EventLifecycleTransition,
    EventMedia,
    EventPrivateConversation,
    EventPrivateMessage,
    EventReview,
    EventReviewComment,
    EventReviewLike,
    EventReviewMedia,
    EventSeries,
    EventSeriesNeedTemplate,
    EventTicketTier,
    EventVendorReview,
    EventView,
    Friendship,
    EventHostVendorMessage,
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


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    """Admin for friendship requests and accepted friendships."""

    list_display = [
        "user1",
        "user2",
        "request_sender",
        "status",
        "met_at_event",
        "accepted_at",
        "updated_at",
    ]
    list_filter = ["status", "accepted_at", "updated_at"]
    search_fields = [
        "user1__username",
        "user2__username",
        "request_sender__username",
        "met_at_event__title",
    ]


@admin.register(EventTicketTier)
class EventTicketTierAdmin(admin.ModelAdmin):
    """Admin for EventTicketTier."""

    list_display = ["event", "name", "price", "capacity", "is_refundable"]
    search_fields = ["event__title", "name"]


@admin.register(EventHighlightLike)
class EventHighlightLikeAdmin(admin.ModelAdmin):
    """Admin for EventHighlightLike."""

    list_display = ["highlight", "user", "created_at"]
    search_fields = ["highlight__id", "user__username"]


@admin.register(EventHighlightComment)
class EventHighlightCommentAdmin(admin.ModelAdmin):
    """Admin for EventHighlightComment."""

    list_display = ["highlight", "author", "parent", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["highlight__id", "author__username", "content"]


@admin.register(EventReviewLike)
class EventReviewLikeAdmin(admin.ModelAdmin):
    """Admin for EventReviewLike."""

    list_display = ["review", "user", "created_at"]
    search_fields = ["review__id", "user__username"]


@admin.register(EventReviewComment)
class EventReviewCommentAdmin(admin.ModelAdmin):
    """Admin for EventReviewComment."""

    list_display = ["review", "author", "parent", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["review__id", "author__username", "content"]


@admin.register(EventHostVendorMessage)
class EventHostVendorMessageAdmin(admin.ModelAdmin):
    """Admin for EventHostVendorMessage."""

    list_display = ["event", "sender", "created_at"]
    search_fields = ["event__title", "sender__username", "text"]
    list_filter = ["created_at"]


@admin.register(EventPrivateConversation)
class EventPrivateConversationAdmin(admin.ModelAdmin):
    """Admin for EventPrivateConversation."""

    list_display = ["event", "participant1", "participant2", "created_at"]
    search_fields = ["event__title", "participant1__username", "participant2__username"]


@admin.register(EventPrivateMessage)
class EventPrivateMessageAdmin(admin.ModelAdmin):
    """Admin for EventPrivateMessage."""

    list_display = ["conversation", "sender", "created_at", "is_read"]
    list_filter = ["is_read", "created_at"]
    search_fields = ["conversation__event__title", "sender__username", "content"]
