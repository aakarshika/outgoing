"""Models for the vendors application."""

from django.conf import settings
from django.db import models

from core.validators import validate_image_upload


class VendorService(models.Model):
    """A service listing that a vendor offers (e.g. DJ, Catering, Photography)."""

    VISIBILITY_CHOICES = [
        ("customer_facing", "Customer-Facing"),
        ("operational", "Operational"),
    ]

    vendor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_services",
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100, help_text="Service category, e.g. DJ, Catering")
    visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="customer_facing"
    )
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Starting price for this service"
    )
    portfolio_image = models.ImageField(
        upload_to="portfolios/",
        null=True,
        blank=True,
        validators=[validate_image_upload],
    )
    location_city = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta configuration for VendorService."""

        ordering = ["-created_at"]

    def __str__(self):
        """String representation of the VendorService."""
        return f"{self.title} by {self.vendor.username}"
