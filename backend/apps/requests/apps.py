"""App configuration for the requests application."""

from django.apps import AppConfig


class RequestsConfig(AppConfig):
    """Configuration for the requests app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.requests"
    verbose_name = "Event Requests"
