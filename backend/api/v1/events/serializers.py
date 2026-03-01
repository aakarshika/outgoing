"""Serializers for event data."""

from rest_framework import serializers

from apps.events.models import Event, EventCategory, EventInterest, EventLifecycleTransition


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


class EventListSerializer(serializers.ModelSerializer):
    """Serializer for event list/card view — enriched for Event Cards."""

    host = EventHostSerializer(read_only=True)
    category = EventCategorySerializer(read_only=True)
    user_is_interested = serializers.SerializerMethodField()
    user_has_ticket = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for EventListSerializer."""

        model = Event
        fields = [
            "id", "host", "title", "slug", "category",
            "location_name", "start_time", "end_time",
            "ticket_price_standard", "ticket_price_flexible",
            "cover_image", "status", "capacity",
            "lifecycle_state",
            "interest_count", "ticket_count",


            "user_is_interested", "user_has_ticket",
        ]

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


class EventDetailSerializer(EventListSerializer):
    """Serializer for the full event detail view."""

    tickets_remaining = serializers.SerializerMethodField()
    location_address = serializers.SerializerMethodField()
    check_in_instructions = serializers.SerializerMethodField()

    class Meta(EventListSerializer.Meta):
        """Meta configuration for EventDetailSerializer."""

        fields = EventListSerializer.Meta.fields + [
            "description", "location_address", "event_ready_message", "check_in_instructions", "latitude", "longitude",
            "refund_window_hours", "tags", "tickets_remaining", "created_at",
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


class EventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events. Accepts multipart/form-data."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=EventCategory.objects.all(), source="category", write_only=True
    )

    class Meta:
        """Meta configuration for EventCreateSerializer."""

        model = Event
        fields = [
            "title", "description", "category_id",
            "location_name", "location_address", "event_ready_message", "check_in_instructions", "latitude", "longitude",
            "start_time", "end_time", "capacity",
            "ticket_price_standard", "ticket_price_flexible",
            "refund_window_hours", "cover_image", "status", "lifecycle_state", "tags",
        ]
        read_only_fields = ["lifecycle_state"]




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
