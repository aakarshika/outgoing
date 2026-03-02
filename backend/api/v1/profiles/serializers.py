"""Serializers for user profile data."""

from rest_framework import serializers

from apps.profiles.models import UserProfile


class IconicHostSerializer(serializers.ModelSerializer):
    """Serializer for iconic hosts on the feed."""

    username = serializers.CharField(source="user.username", read_only=True)
    published_event_count = serializers.IntegerField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    avg_rating = serializers.FloatField(read_only=True)

    class Meta:
        """Meta configuration for IconicHostSerializer."""

        model = UserProfile
        fields = [
            "id", "username", "avatar", "headline", "location_city",
            "published_event_count", "review_count", "avg_rating"
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the UserProfile model."""

    class Meta:
        """Meta configuration for UserProfileSerializer."""

        model = UserProfile
        fields = [
            "phone_number", "bio", "headline", "showcase_bio",
            "avatar", "cover_photo", "location_city",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

