"""Views for ticket endpoints."""

from django.db.models import F
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event
from apps.tickets.models import Ticket
from core.responses import error_response, success_response

from .serializers import TicketPurchaseSerializer, TicketSerializer


class TicketPurchaseView(APIView):
    """Purchase a ticket for an event."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Buy a ticket. One per user per event."""
        try:
            event = Event.objects.get(pk=event_id, status="published")
        except Event.DoesNotExist:
            return error_response(message="Event not found or not published", status=404)

        # Check if already has ticket
        if Ticket.objects.filter(event=event, goer=request.user, status="active").exists():
            return error_response(message="Already have a ticket for this event", status=400)

        # Check capacity
        if event.capacity is not None and event.ticket_count >= event.capacity:
            return error_response(message="Event is sold out", status=400)

        serializer = TicketPurchaseSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        ticket_type = serializer.validated_data.get("ticket_type", "standard")

        # Determine price
        if ticket_type == "flexible" and event.ticket_price_flexible is not None:
            price = event.ticket_price_flexible
        elif event.ticket_price_standard is not None:
            price = event.ticket_price_standard
        else:
            price = 0  # Free event

        ticket = Ticket(
            event=event,
            goer=request.user,
            ticket_type=ticket_type,
            price_paid=price,
        )
        ticket.save()

        # Update denormalized count
        Event.objects.filter(pk=event_id).update(ticket_count=F("ticket_count") + 1)

        result = TicketSerializer(ticket)
        return success_response(data=result.data, message="Ticket purchased", status=201)


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
