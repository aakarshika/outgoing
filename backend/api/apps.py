"""Main API application configuration."""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration class for the API app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
