"""Admin registration for tickets models."""

from django.contrib import admin

from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """Admin for Ticket."""

    list_display = [
        "goer",
        "event",
        "ticket_type",
        "price_paid",
        "status",
        "purchased_at",
    ]
    list_filter = ["status", "ticket_type"]
    search_fields = ["goer__username", "event__title"]
    readonly_fields = ["purchased_at"]
