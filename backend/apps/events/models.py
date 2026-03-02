"""Models for the events application."""

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
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


class EventSeries(models.Model):
    """Groups recurring events together."""

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_series",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    recurrence_rule = models.CharField(max_length=1000, blank=True, help_text="e.g. FREQ=WEEKLY;BYDAY=SU")
    timezone = models.CharField(max_length=100, default='UTC')
    default_location_name = models.CharField(max_length=200, blank=True)
    default_location_address = models.CharField(max_length=300, blank=True)
    default_capacity = models.PositiveIntegerField(null=True, blank=True)
    default_ticket_price_standard = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    default_ticket_price_flexible = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventSeries."""
        verbose_name_plural = "Event Series"
        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the EventSeries."""
        return str(self.name)


class EventSeriesNeedTemplate(models.Model):
    """Reusable needs template for recurring series. Cloned into each occurrence as draft needs."""

    CRITICALITY_CHOICES = [
        ("essential", "Essential"),
        ("replaceable", "Replaceable"),
        ("non_substitutable", "Non-Substitutable"),
    ]

    series = models.ForeignKey(EventSeries, on_delete=models.CASCADE, related_name="need_templates")
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventSeriesNeedTemplate."""
        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the EventSeriesNeedTemplate."""
        return f"{self.title} for {self.series.name}"


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
    series = models.ForeignKey(
        EventSeries,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    occurrence_index = models.PositiveIntegerField(null=True, blank=True, help_text="1-based sequence inside a series")
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


class EventMedia(models.Model):
    """Multiple media items (images or videos) for an event's gallery or highlights."""

    MEDIA_TYPE_CHOICES = [
        ("image", "Image"),
        ("video", "Video"),
    ]
    CATEGORY_CHOICES = [
        ("gallery", "Gallery (Pre-event/Marketing)"),
        ("highlight", "Highlight (Post-event)"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="media")
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default="image")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="gallery")
    file = models.FileField(upload_to="events/media/")
    order = models.PositiveIntegerField(default=0, help_text="Ordering for display")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventMedia."""
        ordering = ["order", "-created_at"]
        verbose_name_plural = "Event Media"

    def __str__(self):
        """String representation of the EventMedia."""
        return f"{self.media_type} for {self.event.title}"


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


class EventHighlight(models.Model):
    """A photo/video highlight attached to an event by the host or a goer."""

    ROLE_CHOICES = [
        ("host", "Host"),
        ("goer", "Goer"),
    ]
    MODERATION_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="highlights")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_highlights")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="goer")
    text = models.TextField(blank=True)
    media_file = models.ImageField(upload_to="highlights/", null=True, blank=True, validators=[validate_image_upload])
    moderation_status = models.CharField(max_length=20, choices=MODERATION_CHOICES, default="approved")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventHighlight."""
        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the EventHighlight."""
        return f"Highlight for {self.event.title} by {self.author.username}"


class EventReview(models.Model):
    """A rating and review left by an attendee for an event."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta configuration for EventReview."""
        unique_together = ["event", "reviewer"]
        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the EventReview."""
        return f"{self.rating}-star review for {self.event.title} by {self.reviewer.username}"


class EventReviewMedia(models.Model):
    """Media attached to an event review."""
    review = models.ForeignKey(EventReview, on_delete=models.CASCADE, related_name="media")
    file = models.ImageField(upload_to="reviews/media/", validators=[validate_image_upload])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class EventVendorReview(models.Model):
    """A rating left for a specific vendor within a broader event review."""
    event_review = models.ForeignKey(EventReview, on_delete=models.CASCADE, related_name="vendor_reviews")
    vendor = models.ForeignKey('vendors.VendorService', on_delete=models.CASCADE, related_name="event_reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["event_review", "vendor"]
        ordering = ["-created_at"]


class EventView(models.Model):
    """Tracks the last time a user viewed an event detail page.

    Used to power the 'Recently Viewed' feed section.
    An upsert pattern is used: calling update_or_create on (event, user)
    refreshes the timestamp each time the user revisits.
    """

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="views")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="viewed_events",
    )
    last_viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration for EventView."""

        unique_together = ["event", "user"]
        ordering = ["-last_viewed_at"]

    def __str__(self):
        """String representation of the EventView."""
        return f"{self.user.username} viewed {self.event.title}"

