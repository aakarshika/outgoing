"""App configuration for the chat application."""

from django.apps import AppConfig


class ChatConfig(AppConfig):
    """Configuration for direct and event-scoped chat messages."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.chat"
    label = "chat"
    verbose_name = "Chat"
