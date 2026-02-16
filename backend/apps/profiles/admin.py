"""Admin configuration for the profiles application."""

from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin configuration for UserProfile model.
    """

    list_display = ("user", "phone_number", "bio", "created_at", "updated_at")
    search_fields = ("user__username", "user__email", "phone_number")

