"""Serializers for ticket data."""

from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for the Ticket model."""

    event_summary = serializers.SerializerMethodField()
    needs_aadhar_verification = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for TicketSerializer."""

        model = Ticket
        fields = [
            "id",
            "event_summary",
            "tier_id",
            "ticket_type",
            "color",
            "guest_name",
            "is_18_plus",
            "barcode",
            "is_refundable",
            "refund_percentage",
            "refund_deadline",
            "price_paid",
            "status",
            "purchased_at",
            "updated_at",
            "needs_aadhar_verification",
        ]
        read_only_fields = [
            "id",
            "is_refundable",
            "refund_deadline",
            "price_paid",
            "status",
            "purchased_at",
            "updated_at",
        ]

    def get_event_summary(self, obj):
        """Return lightweight event summary."""
        return {
            "id": obj.event.id,
            "title": obj.event.title,
            "start_time": obj.event.start_time,
            "location_name": obj.event.location_name,
        }

    def get_needs_aadhar_verification(self, obj):
        profile = getattr(obj.goer, "profile", None)
        if not profile:
            return True
        return not bool(profile.aadhar_number or profile.aadhar_image)


class GuestDetailSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField(required=False, allow_null=True)
    guest_name = serializers.CharField(allow_blank=True, required=False)
    is_18_plus = serializers.BooleanField(default=False)

class TicketPurchaseSerializer(serializers.Serializer):
    """Serializer for ticket purchase requests."""

    tickets = GuestDetailSerializer(many=True, min_length=1, max_length=5)
