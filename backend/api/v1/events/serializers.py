"""Serializers for event data."""

from dateutil.rrule import rrulestr
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.events.models import (
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
    EventTicketTier,
    EventHighlightLike,
    EventHighlightComment,
    EventReviewLike,
    EventReviewLike,
    EventReviewComment,
    EventHostVendorMessage,
    EventPrivateConversation,
    EventPrivateMessage,
    Friendship,
    EventAddon,
)
from apps.needs.models import EventNeed, NeedApplication
from apps.tickets.models import Ticket
from core.utils import resolve_media_url



class EventAddonSerializer(serializers.ModelSerializer):
    """Serializer for event add-ons."""

    class Meta:
        """Meta configuration for EventAddonSerializer."""

        model = EventAddon
        fields = ["id", "addon_slug", "description", "created_at", "updated_at"]


class EventCategorySerializer(serializers.ModelSerializer):
    """Serializer for the EventCategory model."""

    class Meta:
        """Meta configuration for EventCategorySerializer."""

        model = EventCategory
        fields = ["id", "name", "slug", "icon"]


class EventTicketTierSerializer(serializers.ModelSerializer):
    sold_count = serializers.SerializerMethodField()

    class Meta:
        model = EventTicketTier
        fields = [
            "id",
            "name",
            "description",
            "color",
            "price",
            "capacity",
            "is_refundable",
            "refund_percentage",
            "admits",
            "max_passes_per_ticket",
            "sold_count",
        ]

    def get_sold_count(self, obj):
        return obj.tickets.filter(status__in=["active", "used"]).count()


class EventHostSerializer(serializers.Serializer):
    """Lightweight serializer for the event host."""

    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField()
    first_name = serializers.CharField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        """Return the host's avatar URL or None."""
        profile = getattr(obj, "profile", None)
        if profile and profile.avatar:
            return resolve_media_url(profile.avatar, self.context.get("request"))
        return None


class EventMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventMedia
        fields = ["id", "media_type", "category", "file", "order", "created_at"]


class EventListSerializer(serializers.ModelSerializer):
    """Serializer for event list/card view — enriched for Event Cards."""

    host = EventHostSerializer(read_only=True)
    category = EventCategorySerializer(read_only=True)
    series = serializers.SerializerMethodField()
    user_is_interested = serializers.SerializerMethodField()
    user_has_ticket = serializers.SerializerMethodField()
    user_is_vendor = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    ticket_tiers = EventTicketTierSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for EventListSerializer."""

        model = Event
        fields = [
            "id",
            "host",
            "title",
            "slug",
            "category",
            "series",
            "occurrence_index",
            "location_name",
            "location_address",
            "latitude",
            "longitude",
            "start_time",
            "end_time",
            "ticket_price_standard",
            "ticket_price_flexible",
            "cover_image",
            "status",
            "capacity",
            "lifecycle_state",
            "interest_count",
            "ticket_count",
            "media",
            "ticket_tiers",
            "description",
            "reviews",
            "average_rating",
            "user_is_interested",
            "user_has_ticket",
            "user_is_vendor",
        ]

    def get_series(self, obj):
        if obj.series:
            return {"id": obj.series.id, "name": obj.series.name}
        return None

    def get_cover_image(self, obj):
        """Return the frontend asset path or absolute backend media URL."""
        if not obj.cover_image:
            return None
        return resolve_media_url(obj.cover_image, self.context.get("request"))

    def get_user_is_interested(self, obj):
        """Check if the current user is interested in this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return EventInterest.objects.filter(event=obj, user=request.user).exists()
        return False

    def get_user_has_ticket(self, obj):
        """Check if the current user has a ticket for this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.tickets.filter(
                goer=request.user,
                status__in=["active", "used"],
            ).exists()
        return False

    def get_user_is_vendor(self, obj):
        """Check if the current user is a vendor for this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from apps.needs.models import NeedApplication
            from apps.needs.models import EventNeed

            has_accepted_application = NeedApplication.objects.filter(
                vendor=request.user,
                need__event=obj,
                status="accepted",
            ).exists()
            if has_accepted_application:
                return True

            return EventNeed.objects.filter(
                event=obj,
                assigned_vendor=request.user,
            ).exists()
        return False

    def get_media(self, obj):
        """Aggregate media from the entire series if applicable."""
        if obj.series_id:
            # We use a filter on the related name 'media' across all events in the series
            # But it's more direct to use EventMedia model
            return EventMediaSerializer(
                EventMedia.objects.filter(event__series_id=obj.series_id).order_by(
                    "order", "-created_at"
                ),
                many=True,
                context=self.context,
            ).data
        return EventMediaSerializer(
            obj.media.all(), many=True, context=self.context
        ).data

    def get_reviews(self, obj):
        """Return a small subset of public reviews for snippets."""
        reviews = obj.reviews.filter(is_public=True).order_by("-rating")[:2]
        return EventReviewSerializer(reviews, many=True, context=self.context).data

    def get_average_rating(self, obj):
        """Calculate average rating for display."""
        reviews = obj.reviews.filter(is_public=True)
        if not reviews.exists():
            return None
        return sum(r.rating for r in reviews) / len(reviews)


class EventSeriesNeedTemplateSerializer(serializers.ModelSerializer):
    """Serializer for EventSeriesNeedTemplate."""

    class Meta:
        model = EventSeriesNeedTemplate
        fields = [
            "id",
            "title",
            "description",
            "category",
            "criticality",
            "budget_min",
            "budget_max",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EventSeriesSerializer(serializers.ModelSerializer):
    """Basic serializer for Event Series."""

    host = EventHostSerializer(read_only=True)

    class Meta:
        model = EventSeries
        fields = [
            "id",
            "host",
            "name",
            "description",
            "recurrence_rule",
            "timezone",
            "default_location_name",
            "default_location_address",
            "default_capacity",
            "default_ticket_price_standard",
            "default_ticket_price_flexible",
            "created_at",
        ]
        read_only_fields = ["id", "host", "created_at"]


class EventSeriesDetailSerializer(EventSeriesSerializer):
    """Full detail serializer for Event Series with nested templates."""

    need_templates = EventSeriesNeedTemplateSerializer(many=True, read_only=True)

    class Meta(EventSeriesSerializer.Meta):
        fields = EventSeriesSerializer.Meta.fields + ["need_templates"]


class EventDetailSerializer(EventListSerializer):
    """Serializer for the full event detail view."""

    tickets_remaining = serializers.SerializerMethodField()
    location_address = serializers.SerializerMethodField()
    check_in_instructions = serializers.SerializerMethodField()
    highlights = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    participating_vendors = serializers.SerializerMethodField()
    host_events_count = serializers.SerializerMethodField()
    user_tickets = serializers.SerializerMethodField()
    user_applications = serializers.SerializerMethodField()
    attendees = serializers.SerializerMethodField()
    addons = EventAddonSerializer(many=True, read_only=True)

    class Meta(EventListSerializer.Meta):
        """Meta configuration for EventDetailSerializer."""

        fields = EventListSerializer.Meta.fields + [
            "description",
            "location_address",
            "event_ready_message",
            "check_in_instructions",
            "latitude",
            "longitude",
            "refund_window_hours",
            "tags",
            "features",
            "tickets_remaining",
            "created_at",
            "highlights",
            "reviews",
            "average_rating",
            "participating_vendors",
            "host_events_count",
            "user_tickets",
            "user_applications",
            "attendees",
            "addons",
        ]

    def get_user_tickets(self, obj):
        """Get the specific tickets the current user has for this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            tickets = obj.tickets.filter(
                goer=request.user, status__in=["active", "used", "cancelled"]
            )
            from api.v1.tickets.serializers import TicketSerializer

            return TicketSerializer(tickets, many=True, context=self.context).data
        return []

    def get_user_applications(self, obj):
        """Get the specific need applications the current user has for this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            from apps.needs.models import NeedApplication

            applications = NeedApplication.objects.filter(
                vendor=request.user, need__event=obj
            )
            return [
                {
                    "id": app.id,
                    "need_id": app.need.id,
                    "need_title": app.need.title,
                    "service_id": app.service_id,
                    "status": app.status,
                    "proposed_price": str(app.proposed_price)
                    if app.proposed_price
                    else None,
                }
                for app in applications
            ]
        return []

    def get_tickets_remaining(self, obj):
        """Calculate remaining tickets."""
        if obj.capacity is None:
            return None
        return max(0, obj.capacity - obj.ticket_count)

    def _can_view_sensitive_details(self, obj):
        """Paid attendees and host can view sensitive details when event is ready."""
        if obj.lifecycle_state != "event_ready":
            return True

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        if obj.host_id == request.user.id:
            return True
        return obj.tickets.filter(
            goer=request.user,
            status__in=["active", "used"],
        ).exists()

    def get_location_address(self, obj):
        """Return protected address only for authorized viewers in ready/live states."""
        return obj.location_address if self._can_view_sensitive_details(obj) else ""

    def get_check_in_instructions(self, obj):
        """Return protected check-in instructions only to authorized viewers."""
        return (
            obj.check_in_instructions if self._can_view_sensitive_details(obj) else ""
        )

    def get_highlights(self, obj):
        """Aggregate highlights from the entire series if applicable."""
        if obj.series_id:
            highlights = EventHighlight.objects.filter(
                event__series_id=obj.series_id, moderation_status="approved"
            ).order_by("-created_at")
        else:
            # Fallback to single event highlights if not in a series
            # (Prefetch optimization is less effective here but we maintain correctness)
            highlights = obj.highlights.filter(moderation_status="approved").order_by(
                "-created_at"
            )
        return EventHighlightSerializer(
            highlights, many=True, context=self.context
        ).data

    def get_reviews(self, obj):
        """Return full reviews."""
        reviews = getattr(obj, "prefetched_reviews", obj.reviews.all())
        return EventReviewSerializer(reviews, many=True, context=self.context).data

    def get_average_rating(self, obj):
        """Calculate average rating."""
        reviews = getattr(obj, "prefetched_reviews", obj.reviews.filter(is_public=True))
        if not reviews:
            return None
        return sum(r.rating for r in reviews) / len(reviews)

    def get_participating_vendors(self, obj):
        """Return vendors whose needs were filled."""
        needs = obj.needs.filter(status__in=["filled", "completed"]).select_related(
            "assigned_vendor", "assigned_vendor__profile"
        )
        vendors = []
        for need in needs:
            if need.assigned_vendor:
                vendor = need.assigned_vendor
                vendor_name = vendor.get_full_name() or vendor.username
                profile = getattr(vendor, "profile", None)
                vendor_avatar = None
                if profile and profile.avatar:
                    vendor_avatar = resolve_media_url(profile.avatar, self.context.get("request"))

                vendors.append(
                    {
                        "id": vendor.id,
                        "title": need.title,
                        "vendor_name": vendor_name,
                        "vendor_avatar": vendor_avatar,
                        "need_category": need.category,
                    }
                )
        return vendors

    def get_host_events_count(self, obj):
        """Return number of completed events by this host."""
        return Event.objects.filter(host=obj.host, lifecycle_state="completed").count()

    def get_attendees(self, obj):
        """Return list of public attendees (username, avatar, verified status)."""
        # Filter for active/used tickets
        tickets = obj.tickets.select_related("goer", "goer__profile").filter(
            status__in=["active", "used"]
        )

        attendees = []
        for t in tickets:
            user = t.goer
            profile = getattr(user, "profile", None)

            # Check privacy settings
            is_past = obj.lifecycle_state == "completed"
            is_visible = False
            if profile:
                if is_past:
                    is_visible = profile.privacy_events_attended
                else:
                    is_visible = profile.privacy_events_attending
            else:
                # Default visibility if no profile exists (though it should)
                is_visible = True

            if is_visible:
                avatar_url = None
                if profile and profile.avatar:
                    avatar_url = resolve_media_url(profile.avatar, self.context.get("request"))

                attendees.append(
                    {
                        "user_id": user.id,
                        "username": user.username,
                        "name": user.first_name or "",
                        "avatar": avatar_url,
                        "is_verified": False,  # Placeholder for verified tick mark if implemented
                        "bio": profile.bio if profile else None,
                    }
                )

        return attendees


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events. Accepts multipart/form-data."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=EventCategory.objects.all(), source="category", write_only=True
    )
    series_id = serializers.PrimaryKeyRelatedField(
        queryset=EventSeries.objects.all(),
        source="series",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        """Meta configuration for EventCreateSerializer."""

        model = Event
        fields = [
            "title",
            "description",
            "category_id",
            "series_id",
            "occurrence_index",
            "location_name",
            "location_address",
            "event_ready_message",
            "check_in_instructions",
            "latitude",
            "longitude",
            "start_time",
            "end_time",
            "capacity",
            "ticket_price_standard",
            "ticket_price_flexible",
            "refund_window_hours",
            "cover_image",
            "status",
            "lifecycle_state",
            "tags",
            "features",
            "is_recurring",
            "recurrence_rule",
            "generate_count",
            "ticket_tiers",
            "update_series",
        ]
        read_only_fields = ["lifecycle_state", "occurrence_index"]

    ticket_tiers = EventTicketTierSerializer(many=True, required=False)
    is_recurring = serializers.BooleanField(
        required=False, write_only=True, default=False
    )
    recurrence_rule = serializers.CharField(
        required=False, write_only=True, allow_blank=True, allow_null=True
    )
    generate_count = serializers.IntegerField(
        required=False, write_only=True, default=4, min_value=1, max_value=52
    )
    update_series = serializers.BooleanField(
        required=False, write_only=True, default=False
    )

    def to_internal_value(self, data):
        """Parse JSON strings for specific fields when receiving multipart/form-data."""
        # Check if data is a QueryDict-like object (common for multipart/form-data)
        if hasattr(data, "getlist") and not isinstance(data, dict):
            import json

            data = data.copy()
            for field in ("features", "tags", "ticket_tiers"):
                val = data.get(field)
                if isinstance(val, str) and val.strip():
                    try:
                        data[field] = json.loads(val)
                    except (json.JSONDecodeError, ValueError):
                        pass
        return super().to_internal_value(data)

    def validate(self, attrs):
        if attrs.get("is_recurring") and not attrs.get("recurrence_rule"):
            raise serializers.ValidationError(
                {
                    "recurrence_rule": "Recurrence rule is required if event is recurring."
                }
            )
        return super().validate(attrs)

    @transaction.atomic
    def create(self, validated_data):
        is_recurring = validated_data.pop("is_recurring", False)
        recurrence_rule = validated_data.pop("recurrence_rule", None)
        generate_count = validated_data.pop("generate_count", 4)
        ticket_tiers_data = validated_data.pop("ticket_tiers", [])
        update_series = validated_data.pop("update_series", False)

        event = super().create(validated_data)

        # Create ticket tiers
        for tier_data in ticket_tiers_data:
            EventTicketTier.objects.create(event=event, **tier_data)

        if is_recurring and recurrence_rule:
            # Create the internal EventSeries
            series = EventSeries.objects.create(
                host=event.host,
                name=event.title,
                description=event.description,
                recurrence_rule=recurrence_rule,
                timezone=timezone.get_current_timezone_name(),
                default_location_name=event.location_name,
                default_location_address=event.location_address,
                default_capacity=event.capacity,
                default_ticket_price_standard=event.ticket_price_standard,
                default_ticket_price_flexible=event.ticket_price_flexible,
            )

            # Link the first event
            event.series = series
            event.occurrence_index = 1
            event.save()

            # Generate the rest
            dtstart = event.start_time
            duration = event.end_time - event.start_time
            rule = rrulestr(recurrence_rule, dtstart=dtstart)

            dates = []
            for i, dt in enumerate(rule):
                if i == 0:
                    continue  # skip the first one since we already created it
                if len(dates) >= generate_count - 1:
                    break
                dates.append(dt)

            next_index = 2
            for dt in dates:
                # Idempotency check just in case
                if not Event.objects.filter(series=series, start_time=dt).exists():
                    Event.objects.create(
                        host=event.host,
                        series=series,
                        occurrence_index=next_index,
                        title=f"{series.name} #{next_index}",
                        description=event.description,
                        category=event.category,
                        location_name=event.location_name,
                        location_address=event.location_address,
                        start_time=dt,
                        end_time=dt + duration,
                        capacity=event.capacity,
                        ticket_price_standard=event.ticket_price_standard,
                        ticket_price_flexible=event.ticket_price_flexible,
                        status="draft",
                        lifecycle_state="draft",
                    )
                    next_index += 1

        return event


class EventTransitionRequestSerializer(serializers.Serializer):
    """Input serializer for lifecycle state transitions."""

    to_state = serializers.ChoiceField(choices=Event.LIFECYCLE_CHOICES)
    reason = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False)


class EventLifecycleTransitionSerializer(serializers.ModelSerializer):
    """Serializer for lifecycle transition audit entries."""

    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        """Meta configuration for EventLifecycleTransitionSerializer."""

        model = EventLifecycleTransition
        fields = [
            "id",
            "from_state",
            "to_state",
            "reason",
            "metadata",
            "actor_username",
            "created_at",
        ]


class EventAttendeeSerializer(serializers.ModelSerializer):
    """Serializer for attendees of an event."""

    user = EventHostSerializer(source="goer", read_only=True)

    class Meta:
        """Meta configuration for EventAttendeeSerializer."""

        model = Ticket
        fields = [
            "id",
            "user",
            "tier_id",
            "ticket_type",
            "color",
            "guest_name",
            "status",
            "used_at",
            "price_paid",
            "purchased_at",
        ]


class EventHighlightSerializer(serializers.ModelSerializer):
    """Serializer for event highlights."""

    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()
    event_id = serializers.IntegerField(source="event.id", read_only=True)
    # Basic event card details for scrapbook components on the frontend
    event = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for EventHighlightSerializer."""

        model = EventHighlight
        fields = [
            "id",
            "author_username",
            "author_avatar",
            "role",
            "text",
            "media_file",
            "moderation_status",
            "created_at",
            "likes_count",
            "comments_count",
            "user_has_liked",
            "event_id",
            "event",
        ]
        read_only_fields = [
            "id",
            "author_username",
            "author_avatar",
            "moderation_status",
            "created_at",
            "role",
            "likes_count",
            "comments_count",
            "user_has_liked",
            "event",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret["media_file"] = resolve_media_url(
            instance.media_file, self.context.get("request")
        )
        return ret

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_user_has_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_author_avatar(self, obj):
        """Return the author's avatar URL or None."""
        profile = getattr(obj.author, "profile", None)
        if profile and profile.avatar:
            return resolve_media_url(profile.avatar, self.context.get("request"))
        return None

    def get_event(self, obj):
        """
        Return basic event details for this highlight.

        Uses the existing EventListSerializer so the shape matches the
        EventListItem / scrapbook card expectations on the frontend.
        """
        from .serializers import EventListSerializer  # local import to avoid cycles

        return EventListSerializer(obj.event, context=self.context).data


class EventHighlightCommentSerializer(serializers.ModelSerializer):
    """Serializer for event highlight comments."""

    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = EventHighlightComment
        fields = [
            "id",
            "author_username",
            "author_avatar",
            "text",
            "parent",
            "created_at",
            "updated_at",
            "replies",
        ]
        read_only_fields = [
            "id",
            "author_username",
            "author_avatar",
            "created_at",
            "updated_at",
        ]

    def get_author_avatar(self, obj):
        profile = getattr(obj.author, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

    def get_replies(self, obj):
        """Return nested replies."""
        if obj.replies.exists():
            return EventHighlightCommentSerializer(
                obj.replies.all(), many=True, context=self.context
            ).data
        return []


class EventReviewCommentSerializer(serializers.ModelSerializer):
    """Serializer for event review comments."""

    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = EventReviewComment
        fields = [
            "id",
            "author_username",
            "author_avatar",
            "text",
            "parent",
            "created_at",
            "updated_at",
            "replies",
        ]
        read_only_fields = [
            "id",
            "author_username",
            "author_avatar",
            "created_at",
            "updated_at",
        ]

    def get_author_avatar(self, obj):
        profile = getattr(obj.author, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

    def get_replies(self, obj):
        """Return nested replies."""
        if obj.replies.exists():
            return EventReviewCommentSerializer(
                obj.replies.all(), many=True, context=self.context
            ).data
        return []


class EventReviewMediaSerializer(serializers.ModelSerializer):
    """Serializer for event review media."""

    class Meta:
        model = EventReviewMedia
        fields = ["id", "file", "created_at"]
        read_only_fields = ["id", "created_at"]


class EventVendorReviewSerializer(serializers.ModelSerializer):
    """Serializer for vendor reviews."""

    vendor_id = serializers.IntegerField(source="vendor.id", read_only=True)
    vendor_name = serializers.CharField(source="vendor.name", read_only=True)

    class Meta:
        model = EventVendorReview
        fields = ["id", "vendor_id", "vendor_name", "rating", "text", "created_at"]
        read_only_fields = ["id", "vendor_id", "vendor_name", "created_at"]


class EventReviewSerializer(serializers.ModelSerializer):
    """Serializer for event reviews."""

    reviewer_username = serializers.ReadOnlyField(source="reviewer.username")
    reviewer_name = serializers.SerializerMethodField()
    reviewer_avatar = serializers.SerializerMethodField()
    media = EventReviewMediaSerializer(many=True, read_only=True)
    vendor_reviews = EventVendorReviewSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_has_liked = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for EventReviewSerializer."""

        model = EventReview
        fields = [
            "id",
            "reviewer_username",
            "reviewer_name",
            "reviewer_avatar",
            "rating",
            "text",
            "is_public",
            "media",
            "vendor_reviews",
            "created_at",
            "likes_count",
            "comments_count",
            "user_has_liked",
        ]
        read_only_fields = [
            "id",
            "reviewer_username",
            "reviewer_name",
            "reviewer_avatar",
            "created_at",
        ]

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_user_has_liked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_reviewer_name(self, obj):
        """Return the reviewer's full name or username."""
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def get_reviewer_avatar(self, obj):
        """Return the reviewer's avatar URL or None."""
        profile = getattr(obj.reviewer, "profile", None)
        if profile and profile.avatar:
            return resolve_media_url(profile.avatar, self.context.get("request"))
        return None


class EventHostVendorMessageSerializer(serializers.ModelSerializer):
    """Serializer for host-vendor messages."""

    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_avatar = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()

    class Meta:
        model = EventHostVendorMessage
        fields = [
            "id",
            "sender_username",
            "sender_avatar",
            "sender_role",
            "text",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "sender_username",
            "sender_avatar",
            "sender_role",
            "created_at",
        ]

    def get_sender_avatar(self, obj):
        profile = getattr(obj.sender, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

    def get_sender_role(self, obj):
        if obj.event.host_id == obj.sender_id:
            return "host"
        return "vendor"


class EventPrivateMessageSerializer(serializers.ModelSerializer):
    """Serializer for direct user-user chat messages."""

    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = EventPrivateMessage
        fields = [
            "id",
            "sender_username",
            "sender_avatar",
            "text",
            "created_at",
        ]
        read_only_fields = ["id", "sender_username", "sender_avatar", "created_at"]

    def get_sender_avatar(self, obj):
        profile = getattr(obj.sender, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None


class EventPrivateConversationListSerializer(serializers.ModelSerializer):
    """Serializer for the authenticated user's private conversation list."""

    conversation_id = serializers.IntegerField(source="id", read_only=True)
    event_id = serializers.IntegerField(source="event.id", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    other_user_id = serializers.SerializerMethodField()
    other_username = serializers.SerializerMethodField()
    other_avatar = serializers.SerializerMethodField()
    latest_message_text = serializers.CharField(read_only=True, allow_null=True)
    latest_message_sender_username = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = EventPrivateConversation
        fields = [
            "conversation_id",
            "event_id",
            "event_title",
            "other_user_id",
            "other_username",
            "other_avatar",
            "latest_message_text",
            "latest_message_sender_username",
            "updated_at",
        ]
        read_only_fields = fields

    def _get_other_user(self, obj):
        request = self.context.get("request")
        current_user = getattr(request, "user", None)
        if current_user is None:
            return None
        if obj.participant1_id == current_user.id:
            return obj.participant2
        return obj.participant1

    def get_other_user_id(self, obj):
        other_user = self._get_other_user(obj)
        return getattr(other_user, "id", None)

    def get_other_username(self, obj):
        other_user = self._get_other_user(obj)
        return getattr(other_user, "username", None)

    def get_other_avatar(self, obj):
        other_user = self._get_other_user(obj)
        profile = getattr(other_user, "profile", None)
        if profile and profile.avatar:
            return resolve_media_url(profile.avatar, self.context.get("request"))
        return None


class EventGroupChatListSerializer(serializers.ModelSerializer):
    """Serializer for event-level host-vendor group chats."""

    event_id = serializers.IntegerField(source="id", read_only=True)
    event_title = serializers.CharField(source="title", read_only=True)
    latest_message_at = serializers.DateTimeField(read_only=True)
    latest_message_text = serializers.CharField(read_only=True, allow_null=True)
    latest_message_sender_username = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Event
        fields = [
            "event_id",
            "event_title",
            "latest_message_at",
            "latest_message_text",
            "latest_message_sender_username",
        ]
        read_only_fields = fields


class ConversationInboxPrivateSerializer(EventPrivateConversationListSerializer):
    """Private conversation row for the unified inbox (includes last message time)."""

    kind = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta(EventPrivateConversationListSerializer.Meta):
        fields = [
            *EventPrivateConversationListSerializer.Meta.fields,
            "kind",
            "last_message_at",
        ]

    def get_kind(self, obj):
        return "event_private" if obj.event_id else "direct"

    def get_last_message_at(self, obj):
        return getattr(obj, "last_message_at", None)


class ConversationInboxGroupSerializer(serializers.ModelSerializer):
    """Group chat row for the unified inbox."""

    kind = serializers.SerializerMethodField()
    event_id = serializers.IntegerField(source="id", read_only=True)
    event_title = serializers.CharField(source="title", read_only=True)
    last_message_at = serializers.DateTimeField(source="latest_message_at", read_only=True)
    latest_message_text = serializers.CharField(read_only=True, allow_null=True)
    latest_message_sender_username = serializers.CharField(read_only=True, allow_null=True)
    cover_image = serializers.SerializerMethodField()
    location_name = serializers.CharField(read_only=True)
    start_time = serializers.DateTimeField(read_only=True)
    attendee_count = serializers.IntegerField(source="ticket_count", read_only=True)
    group_role = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "kind",
            "event_id",
            "event_title",
            "last_message_at",
            "latest_message_text",
            "latest_message_sender_username",
            "cover_image",
            "location_name",
            "start_time",
            "attendee_count",
            "group_role",
        ]
        read_only_fields = fields

    def get_kind(self, obj):
        return "group"

    def get_cover_image(self, obj):
        if obj.cover_image:
            return resolve_media_url(obj.cover_image, self.context.get("request"))
        return None

    def get_group_role(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return None
        if obj.host_id == user.id:
            return "hosting"
        if EventNeed.objects.filter(event=obj, assigned_vendor=user).exists():
            return "servicing"
        if NeedApplication.objects.filter(need__event=obj, vendor=user).exists():
            return "servicing"
        return None


class FriendshipSerializer(serializers.ModelSerializer):
    """Serializer for friendship requests and accepted friendships."""

    user1_username = serializers.CharField(source="user1.username", read_only=True)
    user2_username = serializers.CharField(source="user2.username", read_only=True)
    request_sender_username = serializers.CharField(
        source="request_sender.username",
        read_only=True,
    )
    met_at_event_title = serializers.CharField(
        source="met_at_event.title", read_only=True, allow_null=True
    )
    orbit_category_slug = serializers.CharField(
        source="orbit_category.slug",
        read_only=True,
    )

    class Meta:
        model = Friendship
        fields = [
            "id",
            "user1",
            "user2",
            "user1_username",
            "user2_username",
            "request_sender",
            "request_sender_username",
            "request_message",
            "status",
            "accepted_at",
            "met_at_event",
            "met_at_event_title",
            "orbit_category",
            "orbit_category_slug",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user1",
            "user2",
            "user1_username",
            "user2_username",
            "request_sender",
            "request_sender_username",
            "status",
            "accepted_at",
            "met_at_event",
            "met_at_event_title",
            "orbit_category",
            "orbit_category_slug",
            "created_at",
            "updated_at",
        ]


class FriendshipRequestCreateSerializer(serializers.Serializer):
    """Validate a friendship request payload."""

    request_message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
    )


class FriendshipActionSerializer(serializers.Serializer):
    """Validate supported friendship state transitions."""

    action = serializers.ChoiceField(choices=["accept", "withdraw", "unfriend", "decline"])
