"""Serializers for ticket data."""

from rest_framework import serializers

from apps.tickets.models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    """Serializer for the Ticket model."""

    event_summary = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for TicketSerializer."""

        model = Ticket
        fields = [
            "id",
            "event_summary",
            "ticket_type",
            "is_refundable",
            "refund_deadline",
            "price_paid",
            "status",
            "purchased_at",
        ]
        read_only_fields = [
            "id",
            "is_refundable",
            "refund_deadline",
            "price_paid",
            "status",
            "purchased_at",
        ]

    def get_event_summary(self, obj):
        """Return lightweight event summary."""
        return {
            "id": obj.event.id,
            "title": obj.event.title,
            "start_time": obj.event.start_time,
            "location_name": obj.event.location_name,
        }


class TicketPurchaseSerializer(serializers.Serializer):
    """Serializer for ticket purchase requests."""

    ticket_type = serializers.ChoiceField(
        choices=["standard", "flexible"], default="standard"
    )
