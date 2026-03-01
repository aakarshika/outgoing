"""Admin registration for vendor models."""

from django.contrib import admin

from .models import VendorService


@admin.register(VendorService)
class VendorServiceAdmin(admin.ModelAdmin):
    """Admin for VendorService."""

    list_display = ["title", "vendor", "category", "base_price", "is_active", "created_at"]
    list_filter = ["is_active", "category", "visibility"]
    search_fields = ["title", "vendor__username"]
