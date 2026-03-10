"""Serializers for ticket data."""

from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for the Ticket model."""

    event_summary = serializers.SerializerMethodField()
    needs_aadhar_verification = serializers.SerializerMethodField()
    qr_token = serializers.SerializerMethodField()

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
            "used_at",
            "purchased_at",
            "updated_at",
            "needs_aadhar_verification",
            "qr_token",
        ]
        read_only_fields = [
            "id",
            "is_refundable",
            "refund_deadline",
            "price_paid",
            "status",
            "used_at",
            "purchased_at",
            "updated_at",
        ]

    def get_event_summary(self, obj):
        """Return detailed event summary for the ticket's event.

        We align this with the event payload used elsewhere (e.g. `Event.to_dict()`)
        so that frontend consumers like `ScrapbookEventCard` receive all the
        expected event fields (cover image, timings, host, etc.).
        """
        event = obj.event
        if hasattr(event, "to_dict"):
            return event.to_dict()

        # Fallback to a minimal summary if `to_dict` is not available
        return {
            "id": event.id,
            "title": event.title,
            "start_time": event.start_time,
            "location_name": event.location_name,
        }

    def get_needs_aadhar_verification(self, obj):
        profile = getattr(obj.goer, "profile", None)
        if not profile:
            return True
        return not bool(profile.aadhar_number or profile.aadhar_image)

    def get_qr_token(self, obj):
        """Generate a signed QR token for the ticket."""
        # Only return the qr_token if the request user is the ticket owner
        request = self.context.get("request")
        if request and request.user == obj.goer:
            from apps.tickets.qr import generate_qr_token
            try:
                return generate_qr_token(obj)
            except ValueError:
                return None
        return None


class GuestDetailSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField(required=False, allow_null=True)
    guest_name = serializers.CharField(allow_blank=True, required=False)
    is_18_plus = serializers.BooleanField(default=False)

class TicketPurchaseSerializer(serializers.Serializer):
    """Serializer for ticket purchase requests."""

    tickets = GuestDetailSerializer(many=True, min_length=1, max_length=5)


class TicketValidateInputSerializer(serializers.Serializer):
    """Input serializer for ticket validation."""

    barcode = serializers.CharField(max_length=100, required=False)
    token = serializers.CharField(required=False)
    event_id = serializers.IntegerField()
    
    def validate(self, data):
        if not data.get("barcode") and not data.get("token"):
            raise serializers.ValidationError("Either barcode or token is required.")
        return data


class TicketAdmitInputSerializer(serializers.Serializer):
    """Input serializer for ticket admission."""

    ticket_id = serializers.IntegerField()
    event_id = serializers.IntegerField()
    is_vendor = serializers.BooleanField(default=False, required=False)
