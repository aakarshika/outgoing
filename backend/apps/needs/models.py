"""Models for the needs application (event needs and vendor applications)."""

from django.conf import settings
from django.db import models

from apps.events.models import Event
from apps.vendors.models import VendorService


class EventNeed(models.Model):
    """An open need on an event that vendors can apply to fill."""

    CRITICALITY_CHOICES = [
        ("essential", "Essential"),
        ("replaceable", "Replaceable"),
        ("non_substitutable", "Non-Substitutable"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("filled", "Filled"),
        ("cancelled", "Cancelled"),
    ]

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="needs"
    )
    title = models.CharField(max_length=200, help_text="e.g. DJ, Photographer")
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, default="other")
    criticality = models.CharField(
        max_length=20, choices=CRITICALITY_CHOICES, default="replaceable"
    )
    budget_min = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    budget_max = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    assigned_vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_needs",
    )
    application_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventNeed."""

        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the EventNeed."""
        return f"{self.title} for {self.event.title}"


class NeedApplication(models.Model):
    """A vendor's application to fill an event need."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    ]

    need = models.ForeignKey(
        EventNeed, on_delete=models.CASCADE, related_name="applications"
    )
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="need_applications",
    )
    service = models.ForeignKey(
        VendorService,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )
    message = models.TextField(blank=True, help_text="Cover letter / pitch")
    proposed_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for NeedApplication."""

        unique_together = ["need", "vendor"]
        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the NeedApplication."""
        return f"{self.vendor.username} applied to {self.need.title}"


class NeedInvite(models.Model):
    """Host invitation asking a vendor to apply for a specific need."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("applied", "Applied"),
        ("dismissed", "Dismissed"),
    ]

    need = models.ForeignKey(
        EventNeed, on_delete=models.CASCADE, related_name="invites"
    )
    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="need_invites",
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_need_invites",
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for NeedInvite."""

        unique_together = ["need", "vendor"]
        ordering = ["-created_at"]

    def __str__(self):
        """String representation of NeedInvite."""
        return f"Invite {self.vendor.username} to {self.need.title}"
