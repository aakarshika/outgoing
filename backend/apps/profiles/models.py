"""Models for the profiles application."""

from django.conf import settings
from django.db import models

from core.validators import validate_image_upload


class UserProfile(models.Model):
    """Extended user data profile model."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    headline = models.CharField(
        max_length=200, blank=True, help_text="Short tagline shown on showcase"
    )
    showcase_bio = models.TextField(
        blank=True, help_text="Longer rich-text bio for showcase page"
    )
    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        validators=[validate_image_upload],
    )
    cover_photo = models.ImageField(
        upload_to="covers/",
        null=True,
        blank=True,
        validators=[validate_image_upload],
    )
    is_vendor = models.BooleanField(
        default=False, help_text="Opted into vendor features"
    )
    location_city = models.CharField(
        max_length=100, blank=True, help_text="City for discovery features"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """String representation of the UserProfile."""
        return f"{self.user.username}'s Profile"


