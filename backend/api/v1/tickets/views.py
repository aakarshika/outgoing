"""Views for ticket endpoints."""

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventTicketTier
from apps.tickets.models import Ticket
from core.responses import error_response, success_response

from .serializers import TicketPurchaseSerializer, TicketSerializer


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

                # Update denormalized count on event
                Event.objects.filter(pk=event_id).update(ticket_count=F("ticket_count") + 1)

        result = TicketSerializer(purchased_tickets, many=True)
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

        serializer = TicketSerializer(tickets, many=True)
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
        return success_response(data=TicketSerializer(ticket).data)

    def delete(self, request, pk):
        """Cancel ticket."""
        ticket = self.get_object(pk, request.user)
        if ticket.status == "cancelled":
            return error_response(message="Ticket is already cancelled.", status=400)
        
        ticket.status = "cancelled"
        ticket.save()

        # Update event ticket count
        Event.objects.filter(pk=ticket.event_id).update(ticket_count=F("ticket_count") - 1)

        refund_amount = 0
        if ticket.is_refundable and ticket.refund_percentage:
            refund_amount = float(ticket.price_paid) * (ticket.refund_percentage / 100.0)

        return success_response(
            message=f"Ticket cancelled. Refund amount: ${refund_amount:.2f}",
            data=TicketSerializer(ticket).data
        )
