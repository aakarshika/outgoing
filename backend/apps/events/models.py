"""Models for the events application."""

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from core.validators import validate_image_upload


class EventCategory(models.Model):
    """Category for classifying events (e.g. Music, Food & Drink)."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, help_text="Lucide icon name for frontend")

    class Meta:
        """Meta configuration for EventCategory."""

        verbose_name_plural = "Event Categories"
        ordering = ["name"]

    def __str__(self):
        """String representation of the EventCategory."""
        return str(self.name)


class Event(models.Model):
    """Core event entity — something happening at a place and time."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]
    LIFECYCLE_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("at_risk", "At Risk"),
        ("postponed", "Postponed"),
        ("event_ready", "Event Ready"),
        ("live", "Live"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]
    ALLOWED_LIFECYCLE_TRANSITIONS = {
        "draft": {"published", "cancelled"},
        "published": {"at_risk", "postponed", "event_ready", "cancelled", "completed"},
        "at_risk": {"published", "postponed", "event_ready", "cancelled"},
        "postponed": {"published", "event_ready", "cancelled"},
        "event_ready": {"at_risk", "live", "cancelled", "completed"},
        "live": {"completed", "cancelled"},
        "cancelled": set(),
        "completed": set(),
    }
    VISIBLE_LIFECYCLE_STATES = (
        "published",
        "at_risk",
        "postponed",
        "event_ready",
        "live",
    )

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_events",
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    category = models.ForeignKey(
        EventCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name="events",
    )
    location_name = models.CharField(max_length=200)
    location_address = models.CharField(max_length=300, blank=True)
    check_in_instructions = models.TextField(blank=True, default="")
    event_ready_message = models.TextField(blank=True, default="")
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    capacity = models.PositiveIntegerField(null=True, blank=True)
    ticket_price_standard = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Non-refundable ticket price. Null means free."
    )
    ticket_price_flexible = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Refundable ticket price (premium tier)."
    )
    refund_window_hours = models.PositiveIntegerField(
        default=24,
        help_text="Hours before start_time that flexible tickets can be refunded."
    )
    cover_image = models.ImageField(
        upload_to="events/",
        null=True,
        blank=True,
        validators=[validate_image_upload],
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    lifecycle_state = models.CharField(
        max_length=20, choices=LIFECYCLE_CHOICES, default="draft"
    )
    tags = models.JSONField(default=list, blank=True)
    interest_count = models.PositiveIntegerField(default=0)
    ticket_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration for Event."""

        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        """Auto-generate slug from title if not set."""
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        if not self.lifecycle_state:
            self.lifecycle_state = self.status
        # Keep lifecycle in sync when legacy status is changed directly.
        if self.status == "cancelled":
            self.lifecycle_state = "cancelled"
        elif self.status == "completed":
            self.lifecycle_state = "completed"
        elif self.status == "draft":
            self.lifecycle_state = "draft"
        elif self.status == "published" and self.lifecycle_state == "draft":
            self.lifecycle_state = "published"
        super().save(*args, **kwargs)

    def can_transition_to(self, to_state):
        """Return True if lifecycle transition is allowed."""
        # Temporary product rule: allow transitions between any lifecycle states.
        return to_state in dict(self.LIFECYCLE_CHOICES)



    def _status_for_lifecycle_state(self, lifecycle_state):
        """Map lifecycle state to coarse-grained legacy status."""
        status_map = {
            "draft": "draft",
            "published": "published",
            "at_risk": "published",
            "postponed": "published",
            "event_ready": "published",
            "live": "published",
            "cancelled": "cancelled",
            "completed": "completed",
        }
        return status_map[lifecycle_state]

    def transition_to(self, to_state, actor=None, reason="", metadata=None):
        """Transition event lifecycle state and create an audit record."""
        metadata = metadata or {}
        from_state = self.lifecycle_state

        if to_state == from_state:
            return None
        if to_state not in dict(self.LIFECYCLE_CHOICES):
            raise ValueError("Unknown lifecycle state")

        self.lifecycle_state = to_state
        self.status = self._status_for_lifecycle_state(to_state)
        self.save(update_fields=["lifecycle_state", "status", "updated_at"])
        return EventLifecycleTransition.objects.create(
            event=self,
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            from_state=from_state,
            to_state=to_state,
            reason=reason or "",
            metadata=metadata,
        )

    def __str__(self):
        """String representation of the Event."""
        return str(self.title)


class EventInterest(models.Model):
    """Lightweight 'I'm interested' signal — social bookmark + demand signal."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="interests"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_interests",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventInterest."""

        unique_together = ["event", "user"]

    def __str__(self):
        """String representation of the EventInterest."""
        return f"{self.user.username} interested in {self.event.title}"


class EventLifecycleTransition(models.Model):
    """Immutable audit log for lifecycle transitions."""

    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="lifecycle_transitions"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_lifecycle_actions",
    )
    from_state = models.CharField(max_length=20, choices=Event.LIFECYCLE_CHOICES)
    to_state = models.CharField(max_length=20, choices=Event.LIFECYCLE_CHOICES)
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventLifecycleTransition."""

        ordering = ["-created_at", "-id"]

    def __str__(self):
        """String representation of the transition."""
        return f"{self.event_id}: {self.from_state} -> {self.to_state}"
