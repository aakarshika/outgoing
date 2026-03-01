"""Serializers for event request data."""

from rest_framework import serializers

from api.v1.events.serializers import EventCategorySerializer
from apps.requests.models import EventRequest


class EventRequestSerializer(serializers.ModelSerializer):
    """Serializer for EventRequest."""

    requester_name = serializers.CharField(source="requester.username", read_only=True)
    category = EventCategorySerializer(read_only=True)
    user_has_upvoted = serializers.SerializerMethodField()
    user_wishlist_as = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for EventRequestSerializer."""

        model = EventRequest
        fields = [
            "id", "requester_name", "title", "description",
            "category", "location_city", "upvote_count",
            "status", "user_has_upvoted", "user_wishlist_as", "created_at",
        ]

    def get_user_has_upvoted(self, obj):
        """Check if current user has upvoted."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(user=request.user).exists()
        return False

    def get_user_wishlist_as(self, obj):
        """Return current user's wishlist intent for this request."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            wishlist = obj.wishlists.filter(user=request.user).values_list(
                "wishlist_as", flat=True
            ).first()
            return wishlist
        return None


class EventRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating event requests."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=__import__("apps.events.models", fromlist=["EventCategory"]).EventCategory.objects.all(),
        source="category",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        """Meta configuration for EventRequestCreateSerializer."""

        model = EventRequest
        fields = ["title", "description", "category_id", "location_city"]
