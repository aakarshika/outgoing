"""Serializers for vendor data."""

from rest_framework import serializers

from apps.vendors.models import VendorService, VendorReview


class VendorServiceSerializer(serializers.ModelSerializer):
    """Serializer for the VendorService model."""

    vendor_name = serializers.CharField(source="vendor.username", read_only=True)
    vendor_id = serializers.IntegerField(source="vendor.id", read_only=True)
    vendor_avatar = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for VendorServiceSerializer."""

        model = VendorService
        fields = [
            "id", "vendor_id", "vendor_name", "vendor_avatar", "title", "description",
            "category", "visibility", "base_price", "portfolio_image",
            "location_city", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_vendor_avatar(self, obj):
        """Return vendor's avatar URL."""
        profile = getattr(obj.vendor, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None


class VendorServiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating vendor services."""

    class Meta:
        """Meta configuration for VendorServiceCreateSerializer."""

        model = VendorService
        fields = [
            "title", "description", "category", "visibility",
            "base_price", "portfolio_image", "location_city",
        ]


class VendorReviewSerializer(serializers.ModelSerializer):
    """Serializer for vendor reviews."""

    reviewer_username = serializers.CharField(source="reviewer.username", read_only=True)
    reviewer_avatar = serializers.SerializerMethodField()
    vendor_service_title = serializers.CharField(source="vendor_service.title", read_only=True)

    class Meta:
        """Meta configuration for VendorReviewSerializer."""
        model = VendorReview
        fields = [
            "id", "reviewer_username", "reviewer_avatar", "vendor_service_title", 
            "rating", "text", "is_public", "created_at"
        ]
        read_only_fields = ["id", "reviewer_username", "reviewer_avatar", "vendor_service_title", "created_at"]

    def get_reviewer_avatar(self, obj):
        """Return the reviewer's avatar URL or None."""
        profile = getattr(obj.reviewer, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(profile.avatar.url)
            return profile.avatar.url
        return None
