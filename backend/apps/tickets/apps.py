"""App configuration for the tickets application."""

from django.apps import AppConfig


class TicketsConfig(AppConfig):
    """Configuration for the tickets app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.tickets"
    verbose_name = "Tickets"

    def ready(self):
        import apps.tickets.signals
