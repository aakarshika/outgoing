"""Views for ticket endpoints."""

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventTicketTier
from apps.tickets.models import Ticket
from apps.tickets.services import TicketValidationError, validate_ticket, admit_ticket, validate_qr_token
from core.responses import error_response, success_response

from .serializers import (
    TicketAdmitInputSerializer,
    TicketPurchaseSerializer,
    TicketSerializer,
    TicketValidateInputSerializer,
)


class TicketPurchaseView(APIView):
    """Purchase a ticket for an event."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Buy a ticket. One per user per event."""
        try:
            event = Event.objects.get(
                pk=event_id, lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
            )
        except Event.DoesNotExist:
            return error_response(
                message="Event not found or not available for ticketing", status=404
            )

        serializer = TicketPurchaseSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        guests = serializer.validated_data.get("tickets", [])
        
        # Check if they have at least one 18+ member
        if not any(guest.get("is_18_plus") for guest in guests):
            return error_response(message="At least one member must be 18+.", status=400)

        # Process each ticket
        purchased_tickets = []
        with transaction.atomic():
            for guest in guests:
                tier_id = guest.get("tier_id")
                guest_name = guest.get("guest_name", "")
                is_18_plus = guest.get("is_18_plus", False)

                if not tier_id:
                    return error_response(message="A ticket tier is required.", status=400)

                try:
                    tier = EventTicketTier.objects.select_for_update().get(id=tier_id, event=event)
                except EventTicketTier.DoesNotExist:
                    return error_response(message=f"Ticket tier {tier_id} not found.", status=400)

                # Verify tier capacity
                if tier.capacity is not None:
                    tier_sold = Ticket.objects.filter(event=event, tier=tier, status="active").count()
                    if tier_sold >= tier.capacity:
                        return error_response(message=f"Tier '{tier.name}' is sold out.", status=400)

                # Verify event overall capacity (optional but good)
                if event.capacity is not None and event.ticket_count >= event.capacity:
                    return error_response(message="The event is at full capacity.", status=400)

                ticket = Ticket(
                    event=event,
                    goer=request.user,
                    tier=tier,
                    ticket_type=tier.name,
                    color=tier.color,
                    guest_name=guest_name,
                    is_18_plus=is_18_plus,
                    is_refundable=tier.is_refundable,
                    refund_percentage=tier.refund_percentage,
                    price_paid=tier.price,
                )
                ticket.save()
                purchased_tickets.append(ticket)

        result = TicketSerializer(purchased_tickets, many=True, context={'request': request})
        return success_response(
            data=result.data, message=f"{len(purchased_tickets)} tickets purchased successfully", status=201
        )


class MyTicketsView(APIView):
    """List the authenticated user's tickets."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all tickets for the current user."""
        tickets = Ticket.objects.filter(goer=request.user).select_related("event")

        status_filter = request.query_params.get("status")
        if status_filter:
            tickets = tickets.filter(status=status_filter)

        serializer = TicketSerializer(tickets, many=True, context={'request': request})
        return success_response(data=serializer.data)


class TicketDetailView(APIView):
    """Retrieve, update, or cancel a ticket."""

    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Ticket, pk=pk, goer=user)

    def patch(self, request, pk):
        """Update ticket (e.g., guest name)."""
        ticket = self.get_object(pk, request.user)
        guest_name = request.data.get("guest_name")
        if guest_name is not None:
            ticket.guest_name = guest_name
            ticket.save()
        return success_response(data=TicketSerializer(ticket, context={'request': request}).data)

    def delete(self, request, pk):
        """Cancel ticket."""
        ticket = self.get_object(pk, request.user)
        if ticket.status == "cancelled":
            return error_response(message="Ticket is already cancelled.", status=400)
        
        ticket.status = "cancelled"
        ticket.save()

        refund_amount = 0
        if ticket.is_refundable and ticket.refund_percentage:
            refund_amount = float(ticket.price_paid) * (ticket.refund_percentage / 100.0)

        return success_response(
            message=f"Ticket cancelled. Refund amount: ${refund_amount:.2f}",
            data=TicketSerializer(ticket, context={'request': request}).data
        )


class TicketValidateView(APIView):
    """Validate a ticket barcode for event entry.

    This endpoint is input-method agnostic — it works for manual entry,
    barcode scanning, and QR scanning.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Validate a barcode against an event."""
        serializer = TicketValidateInputSerializer(data=request.data)
        if not serializer.is_valid():
            print(f"[DEBUG] Serializer Invalid: {serializer.errors}")
            return error_response(message="Validation Error", errors=serializer.errors)

        barcode = serializer.validated_data.get("barcode")
        token = serializer.validated_data.get("token")
        event_id = serializer.validated_data["event_id"]
        
        print(f"[DEBUG] TicketValidateView: event_id={event_id}, token={token[:20] if token else 'None'}..., barcode={barcode}")

        # Verify the caller is the event host
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(
                message="Only the event host can validate tickets.",
                status=403,
            )

        try:
            if token:
                result = validate_qr_token(token, event_id)
            else:
                result = validate_ticket(barcode, event_id)
        except TicketValidationError as e:
            return error_response(
                message=e.message, error_code=e.error_code, status=e.status
            )

        return success_response(data=result)


class TicketAdmitView(APIView):
    """Admit an attendee by marking their ticket as used.

    This endpoint records the admission timestamp and the admitting host.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Admit a ticket holder."""
        serializer = TicketAdmitInputSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        ticket_id = serializer.validated_data["ticket_id"]
        event_id = serializer.validated_data["event_id"]
        is_vendor = serializer.validated_data.get("is_vendor", False)

        # Verify the caller is the event host
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(
                message="Only the event host can admit attendees.",
                status=403,
            )

        try:
            admit_result = admit_ticket(ticket_id, event_id, request.user, is_vendor=is_vendor)
        except TicketValidationError as e:
            return error_response(
                message=e.message, error_code=e.error_code, status=e.status
            )

        return success_response(
            data=admit_result,
            message="Attendee admitted successfully." if not is_vendor else "Vendor admitted successfully.",
        )
