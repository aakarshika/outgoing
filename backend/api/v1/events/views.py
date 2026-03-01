"""Views for event endpoints."""

from django.db.models import F
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventCategory, EventInterest
from apps.tickets.models import Ticket
from core.responses import error_response, success_response

from .serializers import (
    EventCategorySerializer,
    EventCreateSerializer,
    EventDetailSerializer,
    EventListSerializer,
    EventAttendeeSerializer,
)


class EventListCreateView(APIView):
    """List events or create a new event."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Allow public access for GET, require auth for POST."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(responses={200: EventListSerializer(many=True)})
    def get(self, request):
        """List published events with optional filters."""
        events = Event.objects.filter(status="published").select_related(
            "host", "host__profile", "category"
        )

        category = request.query_params.get("category")
        if category:
            events = events.filter(category__slug=category)

        search = request.query_params.get("search")
        if search:
            events = events.filter(title__icontains=search)

        start_after = request.query_params.get("start_after")
        if start_after:
            events = events.filter(start_time__gte=start_after)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total_count = events.count()
        start = (page - 1) * page_size
        events = events[start:start + page_size]

        serializer = EventListSerializer(
            events, many=True, context={"request": request}
        )
        return success_response(
            data=serializer.data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )

    @extend_schema(request=EventCreateSerializer, responses={201: EventDetailSerializer})
    def post(self, request):
        """Create a new event. Authenticated user becomes the host."""
        serializer = EventCreateSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save(host=request.user)
            detail = EventDetailSerializer(event, context={"request": request})
            return success_response(
                data=detail.data, message="Event created", status=201
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class EventDetailView(APIView):
    """Retrieve, update, or delete a specific event."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Allow public access for GET, require auth for PATCH/DELETE."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(responses={200: EventDetailSerializer})
    def get(self, request, event_id):
        """Get full event detail."""
        try:
            event = Event.objects.select_related(
                "host", "host__profile", "category"
            ).get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        serializer = EventDetailSerializer(event, context={"request": request})
        return success_response(data=serializer.data)

    @extend_schema(request=EventCreateSerializer, responses={200: EventDetailSerializer})
    def patch(self, request, event_id):
        """Update an event. Host only."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        serializer = EventCreateSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            detail = EventDetailSerializer(event, context={"request": request})
            return success_response(data=detail.data, message="Event updated")
        return error_response(message="Validation Error", errors=serializer.errors)

    def delete(self, request, event_id):
        """Cancel an event. Host only."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        event.status = "cancelled"
        event.save()
        return success_response(message="Event cancelled")


class EventInterestView(APIView):
    """Toggle interest on an event."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Mark interest in an event."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        _, created = EventInterest.objects.get_or_create(
            event=event, user=request.user
        )
        if not created:
            return error_response(message="Already interested", status=409)

        Event.objects.filter(pk=event_id).update(interest_count=F("interest_count") + 1)
        event.refresh_from_db()
        return success_response(
            data={"interest_count": event.interest_count}, status=201
        )

    def delete(self, request, event_id):
        """Remove interest from an event."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        deleted, _ = EventInterest.objects.filter(
            event=event, user=request.user
        ).delete()
        if not deleted:
            return error_response(message="Not currently interested", status=404)

        Event.objects.filter(pk=event_id).update(interest_count=F("interest_count") - 1)
        event.refresh_from_db()
        return success_response(data={"interest_count": event.interest_count})


class MyEventsView(APIView):
    """List events the authenticated user is hosting."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's hosted events."""
        events = Event.objects.filter(host=request.user).select_related("category")

        status_filter = request.query_params.get("status")
        if status_filter:
            events = events.filter(status=status_filter)

        serializer = EventListSerializer(
            events, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class EventCategoryListView(APIView):
    """List all event categories."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get all categories."""
        categories = EventCategory.objects.all()
        serializer = EventCategorySerializer(categories, many=True)
        return success_response(data=serializer.data)


class EventAttendeesView(APIView):
    """List attendees for an event. Host only."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: EventAttendeeSerializer(many=True)})
    def get(self, request, event_id):
        """Get attendees for an event."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        tickets = Ticket.objects.filter(
            event=event, 
            status__in=["active", "used"]
        ).select_related("goer", "goer__profile")

        serializer = EventAttendeeSerializer(
            tickets, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)
