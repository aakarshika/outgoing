"""Models for the tickets application."""

from datetime import timedelta

from django.conf import settings
from django.db import models

from apps.events.models import Event


class Ticket(models.Model):
    """Represents a goer's attendance at an event."""

    TICKET_TYPE_CHOICES = [
        ("standard", "Standard (Non-Refundable)"),
        ("flexible", "Flexible (Refundable)"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("used", "Used"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="tickets")
    goer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    tier = models.ForeignKey(
        "events.EventTicketTier",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    ticket_type = models.CharField(
        max_length=100, default="standard"
    )
    color = models.CharField(max_length=20, default="gray", help_text="Color based on ticket level")
    guest_name = models.CharField(max_length=200, blank=True, help_text="Name of the guest")
    is_18_plus = models.BooleanField(default=False, help_text="Is the guest 18+?")
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True)
    is_refundable = models.BooleanField(default=False)
    refund_percentage = models.PositiveIntegerField(default=100, help_text="Percentage to refund, 0-100")
    refund_deadline = models.DateTimeField(null=True, blank=True)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    used_at = models.DateTimeField(null=True, blank=True, help_text="When the ticket was admitted/scanned")
    admitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admitted_tickets",
        help_text="Host who admitted this ticket",
    )
    purchased_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration for Ticket."""
        pass

    def save(self, *args, **kwargs):
        """Auto-compute barcode if empty, and manage refundability."""
        if not self.barcode:
            import uuid
            self.barcode = str(uuid.uuid4()).replace("-", "").upper()[:12]
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the Ticket."""
        return f"{self.goer.username} - {self.event.title} ({self.tier.name if self.tier else self.ticket_type})"
