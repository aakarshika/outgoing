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

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="tickets"
    )
    goer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    ticket_type = models.CharField(
        max_length=20, choices=TICKET_TYPE_CHOICES, default="standard"
    )
    is_refundable = models.BooleanField(default=False)
    refund_deadline = models.DateTimeField(null=True, blank=True)
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for Ticket."""

        unique_together = ["event", "goer"]

    def save(self, *args, **kwargs):
        """Auto-compute refundability and deadline from ticket type."""
        if self.ticket_type == "flexible":
            self.is_refundable = True
            if self.event and not self.refund_deadline:
                self.refund_deadline = (
                    self.event.start_time
                    - timedelta(hours=self.event.refund_window_hours)
                )
        else:
            self.is_refundable = False
            self.refund_deadline = None
        super().save(*args, **kwargs)

    def __str__(self):
        """String representation of the Ticket."""
        return f"{self.goer.username} - {self.event.title} ({self.ticket_type})"
