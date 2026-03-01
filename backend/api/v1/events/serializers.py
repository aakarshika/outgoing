"""Serializers for event data."""

from rest_framework import serializers

from apps.events.models import Event, EventCategory, EventInterest
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

    class Meta(EventListSerializer.Meta):
        """Meta configuration for EventDetailSerializer."""

        fields = EventListSerializer.Meta.fields + [
            "description", "location_address", "latitude", "longitude",
            "refund_window_hours", "tags", "tickets_remaining", "created_at",
        ]

    def get_tickets_remaining(self, obj):
        """Calculate remaining tickets."""
        if obj.capacity is None:
            return None
        return max(0, obj.capacity - obj.ticket_count)


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
            "location_name", "location_address", "latitude", "longitude",
            "start_time", "end_time", "capacity",
            "ticket_price_standard", "ticket_price_flexible",
            "refund_window_hours", "cover_image", "status", "tags",
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
