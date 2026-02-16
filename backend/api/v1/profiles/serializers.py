"""Serializers for user profile data."""

from rest_framework import serializers

from apps.profiles.models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the UserProfile model."""

    class Meta:
        """Meta configuration for UserProfileSerializer."""

        model = UserProfile
        fields = ["phone_number", "bio", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

