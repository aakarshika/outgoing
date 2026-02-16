"""Service layer for user and profile management."""

from django.contrib.auth.models import User
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken

from apps.profiles.models import UserProfile


def create_user_and_profile(
    username,
    password,
    *,
    email=None,
    first_name=None,
    last_name=None,
    phone_number=None,
):
    """
    Orchestrates user creation and initial profile setup.
    """
    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email or "",
            password=password,
            first_name=first_name or "",
            last_name=last_name or "",
        )

        profile, _ = UserProfile.objects.get_or_create(
            user=user, defaults={"phone_number": phone_number or ""}
        )

        return user, profile


def get_or_create_profile(user):
    """
    Retrieves or creates a profile for the given user.
    """
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def get_tokens_for_user(user):
    """
    Generates access and refresh tokens for a given user.
    """
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
