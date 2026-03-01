"""App configuration for the needs application."""

from django.apps import AppConfig


class NeedsConfig(AppConfig):
    """Configuration for the needs app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.needs"
    verbose_name = "Event Needs"
