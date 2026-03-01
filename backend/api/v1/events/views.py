"""Views for event endpoints."""

from django.db.models import F, Q
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventCategory, EventInterest, EventReview
from apps.tickets.models import Ticket
from core.responses import error_response, success_response

from .serializers import (
    EventCategorySerializer,
    EventCreateSerializer,
    EventDetailSerializer,
    EventListSerializer,
    EventAttendeeSerializer,
    EventTransitionRequestSerializer,
    EventLifecycleTransitionSerializer,
    EventStorySerializer,
    EventHighlightSerializer,
    EventReviewSerializer,
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
        events = Event.objects.filter(
            lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
        ).select_related(
            "host", "host__profile", "category"
        )

        category = request.query_params.get("category")
        if category:
            events = events.filter(category__slug=category)

        search = request.query_params.get("search")
        if search:
            events = events.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(location_name__icontains=search)
                | Q(location_address__icontains=search)
                | Q(category__name__icontains=search)
            )

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

        try:
            event.transition_to(
                "cancelled",
                actor=request.user,
                reason="Cancelled by host via delete endpoint",
                metadata={"source": "event_delete"},
            )
        except ValueError as exc:
            return error_response(message=str(exc), status=400)
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

        lifecycle_filter = request.query_params.get("lifecycle_state")
        if lifecycle_filter:
            events = events.filter(lifecycle_state=lifecycle_filter)

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


class EventAutocompleteView(APIView):
    """Autocomplete suggestions for event discovery search."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Return lightweight suggestions for the search box."""
        query = (request.query_params.get("q") or "").strip()
        if len(query) < 2:
            return success_response(data=[])

        events = (
            Event.objects.filter(lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES)
            .filter(
                Q(title__icontains=query)
                | Q(location_name__icontains=query)
                | Q(category__name__icontains=query)
            )
            .select_related("category")
            .order_by("-interest_count", "-created_at")[:8]
        )

        suggestions = [
            {
                "id": event.id,
                "title": event.title,
                "location_name": event.location_name,
                "category_name": event.category.name if event.category else None,
            }
            for event in events
        ]
        return success_response(data=suggestions)


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


class EventLifecycleTransitionView(APIView):
    """Transition lifecycle state for an event. Host only."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Transition event lifecycle state with an audit record."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        serializer = EventTransitionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        try:
            transition = event.transition_to(
                to_state=serializer.validated_data["to_state"],
                actor=request.user,
                reason=serializer.validated_data.get("reason", ""),
                metadata=serializer.validated_data.get("metadata", {}),
            )
        except ValueError as exc:
            return error_response(message=str(exc), status=400)

        detail = EventDetailSerializer(event, context={"request": request})
        transition_data = (
            EventLifecycleTransitionSerializer(transition).data if transition else None
        )
        return success_response(
            data={"event": detail.data, "transition": transition_data},
            message="Lifecycle state updated",
        )




class EventLifecycleHistoryView(APIView):
    """Read lifecycle transition history for an event. Host only."""

    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        """List lifecycle transitions in reverse chronological order."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        transitions = event.lifecycle_transitions.select_related("actor").all()
        serializer = EventLifecycleTransitionSerializer(transitions, many=True)
        return success_response(data=serializer.data)


class EventStoryView(APIView):
    """Retrieve the event showcase/story data."""
    
    permission_classes = [AllowAny]

    @extend_schema(responses={200: EventStorySerializer})
    def get(self, request, event_id):
        """Get the full story/showcase data for an event."""
        try:
            event = Event.objects.select_related(
                "host", "host__profile", "category"
            ).prefetch_related(
                "highlights", "highlights__author", "highlights__author__profile",
                "reviews", "reviews__reviewer", "reviews__reviewer__profile"
            ).get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        serializer = EventStorySerializer(event, context={"request": request})
        return success_response(data=serializer.data)


class EventHighlightListCreateView(APIView):
    """Create a highlight for an event."""
    
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        """Public for GET, auth for POST."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def post(self, request, event_id):
        """Post a highlight."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)
        
        role = "host" if event.host == request.user else "goer"
        
        serializer = EventHighlightSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            highlight = serializer.save(event=event, author=request.user, role=role)
            return success_response(data=EventHighlightSerializer(highlight, context={"request": request}).data, status=201)
        return error_response(message="Validation Error", errors=serializer.errors)


class EventReviewCreateView(APIView):
    """Create a review for an event."""
    
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Post a review."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)
        
        if event.host == request.user:
            return error_response(message="Host cannot review their own event", status=403)
            
        if not event.tickets.filter(goer=request.user, status__in=["active", "used"]).exists():
            return error_response(message="You must attend the event to leave a review", status=403)

        if EventReview.objects.filter(event=event, reviewer=request.user).exists():
            return error_response(message="You have already reviewed this event", status=409)

        serializer = EventReviewSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            review = serializer.save(event=event, reviewer=request.user)
            return success_response(data=EventReviewSerializer(review, context={"request": request}).data, status=201)
        return error_response(message="Validation Error", errors=serializer.errors)


