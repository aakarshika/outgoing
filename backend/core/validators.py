"""Reusable validators for the platform."""

from django.core.exceptions import ValidationError


def validate_image_upload(image):
    """
    Validate an uploaded image file.
    - Max 5 MB
    - Allowed formats: JPEG, PNG, WebP
    """
    max_size_mb = 5
    max_size_bytes = max_size_mb * 1024 * 1024
    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if image.size > max_size_bytes:
        raise ValidationError(f"Image must be under {max_size_mb} MB.")

    if hasattr(image, "content_type") and image.content_type not in allowed_types:
        raise ValidationError(
            "Unsupported image format. Use JPEG, PNG, or WebP."
        )
