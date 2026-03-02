"""Serializers for event data."""

from rest_framework import serializers

from apps.events.models import (
    Event, 
    EventCategory, 
    EventSeries,
    EventSeriesNeedTemplate,
    EventInterest, 
    EventLifecycleTransition,
    EventHighlight,
    EventReview,
    EventReviewMedia,
    EventVendorReview,
    EventMedia
)

from dateutil.rrule import rrulestr
from datetime import datetime
from django.utils import timezone
from django.db import transaction

from apps.tickets.models import Ticket


class EventCategorySerializer(serializers.ModelSerializer):
    """Serializer for the EventCategory model."""

    class Meta:
        """Meta configuration for EventCategorySerializer."""

        model = EventCategory
        fields = ["id", "name", "slug", "icon"]


class EventHostSerializer(serializers.Serializer):
    """Lightweight serializer for the event host."""

    username = serializers.CharField()
    first_name = serializers.CharField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        """Return the host's avatar URL or None."""
        profile = getattr(obj, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
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
    media = EventMediaSerializer(many=True, read_only=True)

    class Meta:
        """Meta configuration for EventListSerializer."""

        model = Event
        fields = [
            "id", "host", "title", "slug", "category", "series", "occurrence_index",
            "location_name", "start_time", "end_time",
            "ticket_price_standard", "ticket_price_flexible",
            "cover_image", "status", "capacity",
            "lifecycle_state",
            "interest_count", "ticket_count",

            "media",
            "user_is_interested", "user_has_ticket",
        ]
        
    def get_series(self, obj):
        if obj.series:
            return {"id": obj.series.id, "name": obj.series.name}
        return None

    def get_user_is_interested(self, obj):
        """Check if the current user is interested in this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return EventInterest.objects.filter(
                event=obj, user=request.user
            ).exists()
        return False

    def get_user_has_ticket(self, obj):
        """Check if the current user has a ticket for this event."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.tickets.filter(goer=request.user, status="active").exists()
        return False


class EventSeriesNeedTemplateSerializer(serializers.ModelSerializer):
    """Serializer for EventSeriesNeedTemplate."""
    
    class Meta:
        model = EventSeriesNeedTemplate
        fields = [
            "id", "title", "description", "category", "criticality", 
            "budget_min", "budget_max", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


class EventSeriesSerializer(serializers.ModelSerializer):
    """Basic serializer for Event Series."""
    
    host = EventHostSerializer(read_only=True)
    
    class Meta:
        model = EventSeries
        fields = [
            "id", "host", "name", "description", "recurrence_rule", "timezone",
            "default_location_name", "default_location_address", "default_capacity",
            "default_ticket_price_standard", "default_ticket_price_flexible",
            "created_at"
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

    class Meta(EventListSerializer.Meta):
        """Meta configuration for EventDetailSerializer."""

        fields = EventListSerializer.Meta.fields + [
            "description", "location_address", "event_ready_message", "check_in_instructions", "latitude", "longitude",
            "refund_window_hours", "tags", "tickets_remaining", "created_at",
            "highlights", "reviews", "average_rating", "participating_vendors", "host_events_count"
        ]

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
        return obj.tickets.filter(goer=request.user, status="active").exists()

    def get_location_address(self, obj):
        """Return protected address only for authorized viewers in ready/live states."""
        return obj.location_address if self._can_view_sensitive_details(obj) else ""

    def get_check_in_instructions(self, obj):
        """Return protected check-in instructions only to authorized viewers."""
        return obj.check_in_instructions if self._can_view_sensitive_details(obj) else ""

    def get_highlights(self, obj):
        """Return highlights depending on event state."""
        if obj.lifecycle_state in ["live", "completed"]:
            # Uses the prefetched highlights
            highlights = getattr(obj, "prefetched_highlights", obj.highlights.all())
            return EventHighlightSerializer(highlights, many=True, context=self.context).data
        return []

    def get_reviews(self, obj):
        """Return full reviews only if completed."""
        if obj.lifecycle_state == "completed":
            reviews = getattr(obj, "prefetched_reviews", obj.reviews.all())
            return EventReviewSerializer(reviews, many=True, context=self.context).data
        return []

    def get_average_rating(self, obj):
        """Calculate average rating if completed."""
        if obj.lifecycle_state == "completed":
            reviews = getattr(obj, "prefetched_reviews", obj.reviews.filter(is_public=True))
            if not reviews:
                return None
            return sum(r.rating for r in reviews) / len(reviews)
        return None

    def get_participating_vendors(self, obj):
        """Return vendors whose needs were filled."""
        needs = obj.needs.filter(status__in=["filled", "completed"]).select_related("assigned_vendor", "assigned_vendor__profile")
        vendors = []
        for need in needs:
            if need.assigned_vendor:
                vendor = need.assigned_vendor
                vendor_name = vendor.get_full_name() or vendor.username
                profile = getattr(vendor, "profile", None)
                vendor_avatar = None
                if profile and profile.avatar:
                    request = self.context.get("request")
                    if request:
                        vendor_avatar = request.build_absolute_uri(profile.avatar.url)
                    else:
                        vendor_avatar = profile.avatar.url

                vendors.append({
                    "id": vendor.id,
                    "title": need.title,
                    "vendor_name": vendor_name,
                    "vendor_avatar": vendor_avatar
                })
        return vendors

    def get_host_events_count(self, obj):
        """Return number of completed events by this host."""
        return Event.objects.filter(host=obj.host, lifecycle_state="completed").count()


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events. Accepts multipart/form-data."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=EventCategory.objects.all(), source="category", write_only=True
    )
    series_id = serializers.PrimaryKeyRelatedField(
        queryset=EventSeries.objects.all(), source="series", write_only=True, required=False, allow_null=True
    )

    class Meta:
        """Meta configuration for EventCreateSerializer."""

        model = Event
        fields = [
            "title", "description", "category_id", "series_id", "occurrence_index",
            "location_name", "location_address", "event_ready_message", "check_in_instructions", "latitude", "longitude",
            "start_time", "end_time", "capacity",
            "ticket_price_standard", "ticket_price_flexible",
            "refund_window_hours", "cover_image", "status", "lifecycle_state", "tags",
            "is_recurring", "recurrence_rule", "generate_count"
        ]
        read_only_fields = ["lifecycle_state", "occurrence_index"]

    is_recurring = serializers.BooleanField(required=False, write_only=True, default=False)
    recurrence_rule = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    generate_count = serializers.IntegerField(required=False, write_only=True, default=4, min_value=1, max_value=52)

    def validate(self, attrs):
        if attrs.get("is_recurring") and not attrs.get("recurrence_rule"):
            raise serializers.ValidationError({"recurrence_rule": "Recurrence rule is required if event is recurring."})
        return super().validate(attrs)

    @transaction.atomic
    def create(self, validated_data):
        is_recurring = validated_data.pop("is_recurring", False)
        recurrence_rule = validated_data.pop("recurrence_rule", None)
        generate_count = validated_data.pop("generate_count", 4)

        event = super().create(validated_data)

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
                default_ticket_price_flexible=event.ticket_price_flexible
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
                    continue # skip the first one since we already created it
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
            "id", "user", "ticket_type", "status", "purchased_at"
        ]


class EventHighlightSerializer(serializers.ModelSerializer):
    """Serializer for event highlights."""

    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for EventHighlightSerializer."""
        model = EventHighlight
        fields = [
            "id", "author_username", "author_avatar", "role", "text", 
            "media_file", "moderation_status", "created_at"
        ]
        read_only_fields = ["id", "author_username", "author_avatar", "moderation_status", "created_at", "role"]

    def get_author_avatar(self, obj):
        """Return the author's avatar URL or None."""
        profile = getattr(obj.author, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

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

    reviewer_username = serializers.CharField(source="reviewer.username", read_only=True)
    reviewer_avatar = serializers.SerializerMethodField()
    media = EventReviewMediaSerializer(many=True, read_only=True)
    vendor_reviews = EventVendorReviewSerializer(many=True, read_only=True)

    class Meta:
        """Meta configuration for EventReviewSerializer."""
        model = EventReview
        fields = ["id", "reviewer_username", "reviewer_avatar", "rating", "text", "is_public", "media", "vendor_reviews", "created_at"]
        read_only_fields = ["id", "reviewer_username", "reviewer_avatar", "created_at"]

    def get_reviewer_avatar(self, obj):
        """Return the reviewer's avatar URL or None."""
        profile = getattr(obj.reviewer, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None

