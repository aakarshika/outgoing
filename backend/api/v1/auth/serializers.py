"""Serializers for authentication-related data."""

from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the standard Django User model."""

    role = serializers.SerializerMethodField()
    class Meta:
        """Meta options for UserSerializer."""

        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role"]

    def get_role(self, obj):
        """Return the user role, defaulting to USER."""
        return "USER"


class SignUpSerializer(serializers.Serializer):
    """Serializer for new user registration."""

    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validate password presence."""
        if not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required."})
        return attrs


class LoginSerializer(serializers.Serializer):
    """Serializer for user login credentials."""

    username = serializers.CharField()
    password = serializers.CharField(required=False, allow_blank=True)
