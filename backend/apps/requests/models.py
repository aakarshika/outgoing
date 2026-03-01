"""Models for the event requests application."""

from django.conf import settings
from django.db import models

from apps.events.models import EventCategory


class EventRequest(models.Model):
    """A goer's public request for an event they'd like to see happen."""

    STATUS_CHOICES = [
        ("open", "Open"),
        ("fulfilled", "Fulfilled"),
        ("closed", "Closed"),
    ]

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_requests",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        EventCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requests",
    )
    location_city = models.CharField(max_length=100, blank=True)
    upvote_count = models.PositiveIntegerField(default=0)
    fulfilled_event = models.ForeignKey(
        "events.Event",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fulfills_request",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventRequest."""

        ordering = ["-upvote_count", "-created_at"]

    def __str__(self):
        """String representation of the EventRequest."""
        return str(self.title)


class RequestUpvote(models.Model):
    """An upvote on an event request — signals demand."""

    request = models.ForeignKey(
        EventRequest, on_delete=models.CASCADE, related_name="upvotes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="request_upvotes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for RequestUpvote."""

        unique_together = ["request", "user"]

    def __str__(self):
        """String representation of the RequestUpvote."""
        return f"{self.user.username} upvoted {self.request.title}"
