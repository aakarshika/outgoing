"""Models for the profiles application."""

from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    """Extended user data profile model."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """String representation of the UserProfile."""
        return f"{self.user.username}'s Profile"

