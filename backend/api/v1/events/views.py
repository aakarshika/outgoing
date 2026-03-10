"""Views for event endpoints."""

import json

from django.db import transaction
from django.db.models import F, Q
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import (
    Event,
    EventCategory,
    EventInterest,
    EventReview,
    EventView,
    EventTicketTier,
    EventHighlight,
    EventHighlightLike,
    EventHighlightComment,
    EventReviewLike,
    EventReviewLike,
    EventReviewComment,
    EventHostVendorMessage,
)
from apps.tickets.models import Ticket
from core.responses import error_response, success_response

from .serializers import (
    EventAttendeeSerializer,
    EventCategorySerializer,
    EventCreateSerializer,
    EventDetailSerializer,
    EventHighlightSerializer,
    EventLifecycleTransitionSerializer,
    EventListSerializer,
    EventReviewSerializer,
    EventTransitionRequestSerializer,
    EventTicketTierSerializer,
    EventHighlightCommentSerializer,
    EventHighlightCommentSerializer,
    EventReviewCommentSerializer,
    EventHostVendorMessageSerializer,
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
        ).select_related("host", "host__profile", "category")

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
        events = events[start : start + page_size]

        serializer = EventListSerializer(
            events, many=True, context={"request": request}
        )
        return success_response(
            data=serializer.data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )

    @extend_schema(
        request=EventCreateSerializer, responses={201: EventDetailSerializer}
    )
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
        """Get full event detail including highlights and reviews."""
        try:
            event = (
                Event.objects.select_related("host", "host__profile", "category")
                .prefetch_related(
                    "highlights",
                    "highlights__author",
                    "highlights__author__profile",
                    "reviews",
                    "reviews__reviewer",
                    "reviews__reviewer__profile",
                )
                .get(pk=event_id)
            )
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        serializer = EventDetailSerializer(event, context={"request": request})
        return success_response(data=serializer.data)

    @extend_schema(
        request=EventCreateSerializer, responses={200: EventDetailSerializer}
    )
    def patch(self, request, event_id):
        """Update an event. Host only."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        data = request.data
        update_series = data.get("update_series") == "true" or data.get("update_series") is True

        serializer = EventCreateSerializer(event, data=data, partial=True)
        if serializer.is_valid():
            with transaction.atomic():
                updated_event = serializer.save()
                
                if update_series and updated_event.series:
                    # Find all future/draft/published events in the same series
                    other_events = Event.objects.filter(
                        series=updated_event.series,
                        lifecycle_state__in=["draft", "published"]
                    ).exclude(pk=updated_event.pk)

                    # Fields to propagate from validated_data
                    propagate_fields = [
                        "title", "description", "category", "location_name", 
                        "location_address", "latitude", "longitude", "capacity",
                        "event_ready_message", "check_in_instructions", "features", "tags"
                    ]
                    
                    update_data = {}
                    for field in propagate_fields:
                        if field in serializer.validated_data:
                            update_data[field] = serializer.validated_data[field]

                    # Special handling for times: Sync time-of-day and duration, keep dates
                    sync_times = "start_time" in serializer.validated_data or "end_time" in serializer.validated_data
                    
                    for other in other_events:
                        for field, value in update_data.items():
                            setattr(other, field, value)
                        
                        if sync_times:
                            # Apply the same time of day and duration
                            duration = updated_event.end_time - updated_event.start_time
                            
                            # Update start_time to same time of day on other's date
                            new_start = other.start_time.replace(
                                hour=updated_event.start_time.hour,
                                minute=updated_event.start_time.minute,
                                second=updated_event.start_time.second,
                                microsecond=updated_event.start_time.microsecond
                            )
                            other.start_time = new_start
                            other.end_time = new_start + duration
                        
                        other.save()

            detail = EventDetailSerializer(updated_event, context={"request": request})
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


class EventTicketTierListView(APIView):
    """List or bulk update ticket tiers for an event."""

    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        tiers = event.ticket_tiers.all()
        serializer = EventTicketTierSerializer(tiers, many=True)
        return success_response(data=serializer.data)

    def put(self, request, event_id):
        """Bulk replace ticket tiers."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        update_series = request.query_params.get("update_series") == "true"
        tiers_data = request.data
        if not isinstance(tiers_data, list):
            return error_response(message="Expected a list of tiers", status=400)
            
        color_palette = ["#f59e0b", "#94a3b8", "#eab308", "#10b981", "#8b5cf6"] # Bronze, Silver, Gold, Emerald, Purple
            
        with transaction.atomic():
            # Get existing tiers to determine what to delete later
            incoming_ids = [t.get("id") for t in tiers_data if t.get("id")]
            event.ticket_tiers.exclude(id__in=incoming_ids).delete()
            
            # Sort tiers by price for color assignment
            sorted_tiers = sorted(tiers_data, key=lambda x: float(x.get("price", 0)))
            
            for index, tier_data in enumerate(sorted_tiers):
                tier_data["event"] = event.id
                if not tier_data.get("color"):
                    tier_data["color"] = color_palette[index % len(color_palette)]
                
                tier_id = tier_data.get("id")
                if tier_id:
                    try:
                        instance = EventTicketTier.objects.get(id=tier_id, event=event)
                        serializer = EventTicketTierSerializer(instance, data=tier_data, partial=True)
                    except EventTicketTier.DoesNotExist:
                        # If ID provided but not found for this event, treat as new (or could error)
                        serializer = EventTicketTierSerializer(data=tier_data)
                else:
                    serializer = EventTicketTierSerializer(data=tier_data)

                if serializer.is_valid():
                    serializer.save(event=event)
                else:
                    return error_response(
                        message=f"Validation error in tier '{tier_data.get('name', 'unknown')}'", 
                        errors=serializer.errors,
                        status=400
                    )

            if update_series and event.series:
                other_events = Event.objects.filter(
                    series=event.series,
                    lifecycle_state__in=["draft", "published"]
                ).exclude(pk=event.pk)
                
                for other in other_events:
                    # For other events, we match by name since IDs will be different
                    existing_other_tiers = {t.name: t for t in other.ticket_tiers.all()}
                    incoming_names = [t.get("name") for t in sorted_tiers]
                    
                    # Delete tiers that no longer exist in the new set
                    other.ticket_tiers.exclude(name__in=incoming_names).delete()
                    
                    for index, tier_data in enumerate(sorted_tiers):
                        name = tier_data["name"]
                        if name in existing_other_tiers:
                            # Update existing
                            tier = existing_other_tiers[name]
                            tier.description = tier_data.get("description", "")
                            tier.admits = tier_data.get("admits", 1)
                            tier.max_passes_per_ticket = tier_data.get("max_passes_per_ticket", 6)
                            tier.color = tier_data.get("color", color_palette[index % len(color_palette)])
                            tier.price = tier_data["price"]
                            tier.capacity = tier_data.get("capacity")
                            tier.is_refundable = tier_data.get("is_refundable", False)
                            tier.refund_percentage = tier_data.get("refund_percentage", 100)
                            tier.save()
                        else:
                            # Create new
                            EventTicketTier.objects.create(
                                event=other,
                                name=name,
                                description=tier_data.get("description", ""),
                                admits=tier_data.get("admits", 1),
                                max_passes_per_ticket=tier_data.get("max_passes_per_ticket", 6),
                                color=tier_data.get("color", color_palette[index % len(color_palette)]),
                                price=tier_data["price"],
                                capacity=tier_data.get("capacity"),
                                is_refundable=tier_data.get("is_refundable", False),
                                refund_percentage=tier_data.get("refund_percentage", 100),
                            )
                    
        updated_tiers = event.ticket_tiers.all()
        return success_response(
            data=EventTicketTierSerializer(updated_tiers, many=True).data,
            message="Ticket tiers updated"
        )


class EventInterestView(APIView):
    """Toggle interest on an event."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Mark interest in an event."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        _, created = EventInterest.objects.get_or_create(event=event, user=request.user)
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


class MyInterestedEventsView(APIView):
    """List events the authenticated user is interested in."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's interested events."""
        events = Event.objects.filter(
            interests__user=request.user,
        ).select_related("host", "host__profile", "category")

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
            event=event, status__in=["active", "used"]
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

        serializer = EventHighlightSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            highlight = serializer.save(event=event, author=request.user, role=role)
            return success_response(
                data=EventHighlightSerializer(
                    highlight, context={"request": request}
                ).data,
                status=201,
            )
        return error_response(message="Validation Error", errors=serializer.errors)

    def get(self, request, event_id):
        """Get highlights for an event, or its entire series if requested."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        include_series = request.query_params.get("series") == "true"
        if include_series and event.series_id:
            highlights = EventHighlight.objects.filter(
                event__series_id=event.series_id, moderation_status="approved"
            ).order_by("-created_at")
        else:
            highlights = event.highlights.filter(moderation_status="approved").order_by("-created_at")

        serializer = EventHighlightSerializer(
            highlights, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class EventHighlightLikeToggleView(APIView):
    """Toggle like on an event highlight."""

    permission_classes = [IsAuthenticated]

    def post(self, request, highlight_id):
        try:
            highlight = EventHighlight.objects.get(pk=highlight_id)
        except EventHighlight.DoesNotExist:
            return error_response(message="Highlight not found", status=404)

        like, created = EventHighlightLike.objects.get_or_create(
            highlight=highlight, user=request.user
        )
        if not created:
            like.delete()
            return success_response(data={"liked": False, "likes_count": highlight.likes.count()})

        return success_response(
            data={"liked": True, "likes_count": highlight.likes.count()}, status=201
        )


class EventHighlightCommentCreateListView(APIView):
    """List or create comments for an event highlight."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, highlight_id):
        try:
            highlight = EventHighlight.objects.get(pk=highlight_id)
        except EventHighlight.DoesNotExist:
            return error_response(message="Highlight not found", status=404)

        # Only return top-level comments; serializer will handle nesting
        comments = highlight.comments.filter(parent__isnull=True).select_related("author", "author__profile")
        serializer = EventHighlightCommentSerializer(
            comments, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)

    def post(self, request, highlight_id):
        try:
            highlight = EventHighlight.objects.get(pk=highlight_id)
        except EventHighlight.DoesNotExist:
            return error_response(message="Highlight not found", status=404)

        serializer = EventHighlightCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(highlight=highlight, author=request.user)
            return success_response(data=serializer.data, status=201)
        return error_response(message="Validation Error", errors=serializer.errors)


class EventReviewCreateView(APIView):
    """Create a review for an event."""

    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):  # noqa: C901
        """Post a review with optional media and vendor ratings."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host == request.user:
            return error_response(
                message="Host cannot review their own event", status=403
            )

        if not event.tickets.filter(
            goer=request.user, status__in=["active", "used"]
        ).exists():
            return error_response(
                message="You must attend the event to leave a review", status=403
            )

        if EventReview.objects.filter(event=event, reviewer=request.user).exists():
            return error_response(
                message="You have already reviewed this event", status=409
            )

        serializer = EventReviewSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            review = serializer.save(event=event, reviewer=request.user)

            # Handle media files
            media_files = request.FILES.getlist("media")
            from apps.events.models import EventReviewMedia

            for file in media_files:
                EventReviewMedia.objects.create(review=review, file=file)

            # Handle vendor reviews
            vendor_reviews_data = request.data.get("vendor_reviews")
            if vendor_reviews_data:
                try:
                    if isinstance(vendor_reviews_data, str):
                        vendor_reviews_data = json.loads(vendor_reviews_data)

                    from apps.events.models import EventVendorReview

                    for v_review in vendor_reviews_data:
                        EventVendorReview.objects.create(
                            event_review=review,
                            vendor_id=v_review.get("vendor_id"),
                            rating=v_review.get("rating"),
                            text=v_review.get("text", ""),
                        )
                except (ValueError, TypeError, json.JSONDecodeError):
                    pass  # Or handle error appropriately

            return success_response(
                data=EventReviewSerializer(review, context={"request": request}).data,
                status=201,
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class EventReviewDetailView(APIView):
    """Retrieve, update, or delete a specific review."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, review_id):
        try:
            review = EventReview.objects.get(pk=review_id)
        except EventReview.DoesNotExist:
            return error_response(message="Review not found", status=404)

        serializer = EventReviewSerializer(review, context={"request": request})
        return success_response(data=serializer.data)

    def patch(self, request, review_id):
        try:
            review = EventReview.objects.get(pk=review_id)
        except EventReview.DoesNotExist:
            return error_response(message="Review not found", status=404)

        if review.reviewer != request.user:
            return error_response(message="Not authorized", status=403)

        serializer = EventReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(data=serializer.data, message="Review updated")
        return error_response(message="Validation Error", errors=serializer.errors)

    def delete(self, request, review_id):
        try:
            review = EventReview.objects.get(pk=review_id)
        except EventReview.DoesNotExist:
            return error_response(message="Review not found", status=404)

        if review.reviewer != request.user:
            return error_response(message="Not authorized", status=403)

        review.delete()
        return success_response(message="Review deleted")


class EventReviewLikeToggleView(APIView):
    """Toggle like on an event review."""

    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        try:
            review = EventReview.objects.get(pk=review_id)
        except EventReview.DoesNotExist:
            return error_response(message="Review not found", status=404)

        like, created = EventReviewLike.objects.get_or_create(
            review=review, user=request.user
        )
        if not created:
            like.delete()
            return success_response(data={"liked": False, "likes_count": review.likes.count()})

        return success_response(
            data={"liked": True, "likes_count": review.likes.count()}, status=201
        )


class EventReviewCommentCreateListView(APIView):
    """List or create comments for an event review."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, review_id):
        try:
            review = EventReview.objects.get(pk=review_id)
        except EventReview.DoesNotExist:
            return error_response(message="Review not found", status=404)

        # Only return top-level comments; serializer will handle nesting
        comments = review.comments.filter(parent__isnull=True).select_related("author", "author__profile")
        serializer = EventReviewCommentSerializer(
            comments, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)

    def post(self, request, review_id):
        try:
            review = EventReview.objects.get(pk=review_id)
        except EventReview.DoesNotExist:
            return error_response(message="Review not found", status=404)

        serializer = EventReviewCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(review=review, author=request.user)
            return success_response(data=serializer.data, status=201)
        return error_response(message="Validation Error", errors=serializer.errors)


class EventViewView(APIView):
    """Record that an authenticated user viewed an event — powers 'Recently Viewed' feed."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        """Upsert an EventView record for this user so last_viewed_at is always fresh."""
        from django.utils import timezone as tz

        try:
            event = Event.objects.only("id").get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        view_obj, created = EventView.objects.get_or_create(
            event=event, user=request.user
        )
        if not created:
            # auto_now won't fire on update(), so use a direct update
            EventView.objects.filter(pk=view_obj.pk).update(last_viewed_at=tz.now())

        return success_response(data={"recorded": True}, status=201 if created else 200)


class EventHostVendorMessageListCreateView(APIView):
    """List or create chat messages between host and vendors for an event."""

    permission_classes = [IsAuthenticated]

    def _is_authorized(self, event, user):
        """Check if user is host or confirmed vendor."""
        if event.host == user:
            return True
        from apps.needs.models import NeedApplication
        return NeedApplication.objects.filter(vendor=user, need__event=event).exists()

    def get(self, request, event_id):
        """Get all messages for this event's host-vendor chat."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if not self._is_authorized(event, request.user):
            return error_response(message="Not authorized to view this chat", status=403)

        messages = event.host_vendor_messages.select_related("sender", "sender__profile")
        serializer = EventHostVendorMessageSerializer(
            messages, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)

    def post(self, request, event_id):
        """Post a new message in the host-vendor chat."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if not self._is_authorized(event, request.user):
            return error_response(message="Not authorized to post in this chat", status=403)

        serializer = EventHostVendorMessageSerializer(data=request.data)
        if serializer.is_valid():
            message = serializer.save(event=event, sender=request.user)
            return success_response(
                data=EventHostVendorMessageSerializer(
                    message, context={"request": request}
                ).data,
                status=201,
            )
        return error_response(message="Validation Error", errors=serializer.errors)
