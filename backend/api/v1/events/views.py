"""Views for event endpoints."""

import json

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Max, OuterRef, Q, Subquery
from django.utils import timezone
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
    EventPrivateConversation,
    EventPrivateMessage,
    Friendship,
)
from apps.needs.models import EventNeed
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
    EventGroupChatListSerializer,
    EventPrivateConversationListSerializer,
    EventPrivateMessageSerializer,
    FriendshipActionSerializer,
    FriendshipRequestCreateSerializer,
    FriendshipSerializer,
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
        """Check if user is host, confirmed vendor, or attendee with an active ticket."""
        if event.host == user:
            return True
        from apps.needs.models import NeedApplication
        from apps.needs.models import EventNeed

        if NeedApplication.objects.filter(
            vendor=user,
            need__event=event,
            status="accepted",
        ).exists():
            return True
        if EventNeed.objects.filter(event=event, assigned_vendor=user).exists():
            return True
        from apps.tickets.models import Ticket
        return Ticket.objects.filter(
            goer=user,
            event=event,
            status__in=["active", "used"],
        ).exists()

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


class UserDirectMessageListCreateView(APIView):
    """List or create direct messages between the authenticated user and a target user."""

    permission_classes = [IsAuthenticated]

    def _get_target_user(self, target_username):
        User = get_user_model()
        try:
            return User.objects.get(username=target_username)
        except User.DoesNotExist:
            return None

    def _get_conversation(self, user_a, user_b):
        participant1, participant2 = sorted([user_a, user_b], key=lambda user: user.id)
        return EventPrivateConversation.objects.filter(
            participant1=participant1,
            participant2=participant2,
        ).first()

    def get(self, request, target_username):
        target_user = self._get_target_user(target_username)
        if target_user is None:
            return error_response(message="User not found", status=404)
        if target_user == request.user:
            return error_response(message="Cannot open direct chat with yourself", status=400)

        conversation = self._get_conversation(request.user, target_user)
        if conversation is None:
            return success_response(data=[])

        messages = conversation.messages.select_related("sender", "sender__profile")
        serializer = EventPrivateMessageSerializer(
            messages, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)

    def post(self, request, target_username):
        target_user = self._get_target_user(target_username)
        if target_user is None:
            return error_response(message="User not found", status=404)
        if target_user == request.user:
            return error_response(message="Cannot send direct messages to yourself", status=400)

        serializer = EventPrivateMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        participant1, participant2 = sorted(
            [request.user, target_user], key=lambda user: user.id
        )
        conversation, _ = EventPrivateConversation.objects.get_or_create(
            participant1=participant1,
            participant2=participant2,
            defaults={"event": None},
        )
        message = serializer.save(conversation=conversation, sender=request.user)
        conversation.save(update_fields=["updated_at"])
        return success_response(
            data=EventPrivateMessageSerializer(
                message, context={"request": request}
            ).data,
            status=201,
        )


class EventPrivateConversationListView(APIView):
    """List all private conversations for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            EventPrivateConversation.objects.filter(
                Q(participant1=request.user) | Q(participant2=request.user)
            )
            .annotate(
                latest_message_text=Subquery(
                    EventPrivateMessage.objects.filter(conversation=OuterRef("pk"))
                    .order_by("-created_at")
                    .values("text")[:1]
                )
            )
            .annotate(
                latest_message_sender_username=Subquery(
                    EventPrivateMessage.objects.filter(conversation=OuterRef("pk"))
                    .order_by("-created_at")
                    .values("sender__username")[:1]
                )
            )
            .select_related(
                "event",
                "participant1",
                "participant1__profile",
                "participant2",
                "participant2__profile",
            )
            .order_by("-updated_at")
        )

        management = conversations.filter(event__isnull=False)
        network = conversations.filter(event__isnull=True)

        group_chats = (
            Event.objects.filter(host_vendor_messages__isnull=False)
            .filter(
                Q(host=request.user)
                | Q(needs__applications__vendor=request.user)
                | Q(tickets__goer=request.user, tickets__status__in=["active", "used"])
            )
            .annotate(latest_message_at=Max("host_vendor_messages__created_at"))
            .annotate(
                latest_message_text=Subquery(
                    EventHostVendorMessage.objects.filter(event=OuterRef("pk"))
                    .order_by("-created_at")
                    .values("text")[:1]
                )
            )
            .annotate(
                latest_message_sender_username=Subquery(
                    EventHostVendorMessage.objects.filter(event=OuterRef("pk"))
                    .order_by("-created_at")
                    .values("sender__username")[:1]
                )
            )
            .distinct()
            .order_by("-latest_message_at")
        )

        serializer_context = {"request": request}
        return success_response(
            data={
                "management_group": EventGroupChatListSerializer(
                    group_chats,
                    many=True,
                    context=serializer_context,
                ).data,
                "management": EventPrivateConversationListSerializer(
                    management,
                    many=True,
                    context=serializer_context,
                ).data,
                "network": EventPrivateConversationListSerializer(
                    network,
                    many=True,
                    context=serializer_context,
                ).data,
            }
        )


class EventPrivateConversationMessageListCreateView(APIView):
    """List or create messages within a private conversation."""

    permission_classes = [IsAuthenticated]

    def _get_conversation(self, request, conversation_id):
        return (
            EventPrivateConversation.objects.filter(
                id=conversation_id,
            )
            .filter(Q(participant1=request.user) | Q(participant2=request.user))
            .first()
        )

    def get(self, request, conversation_id):
        conversation = self._get_conversation(request, conversation_id)
        if conversation is None:
            return error_response(message="Conversation not found", status=404)

        messages = conversation.messages.select_related("sender", "sender__profile")
        serializer = EventPrivateMessageSerializer(
            messages, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)

    def post(self, request, conversation_id):
        conversation = self._get_conversation(request, conversation_id)
        if conversation is None:
            return error_response(message="Conversation not found", status=404)

        serializer = EventPrivateMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        message = serializer.save(conversation=conversation, sender=request.user)
        conversation.save(update_fields=["updated_at"])
        return success_response(
            data=EventPrivateMessageSerializer(
                message, context={"request": request}
            ).data,
            status=201,
        )


class EventPrivateConversationGetOrCreateView(APIView):
    """Get or create an event-tied private conversation."""

    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        target_username = request.data.get("target_username")
        if not target_username:
            return error_response(message="target_username is required", status=400)

        User = get_user_model()
        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return error_response(message="User not found", status=404)

        if target_user == request.user:
            return error_response(message="Cannot create a conversation with yourself", status=400)

        participant1, participant2 = sorted(
            [request.user, target_user], key=lambda user: user.id
        )
        conversation, created = EventPrivateConversation.objects.get_or_create(
            participant1=participant1,
            participant2=participant2,
            defaults={"event": event},
        )
        if conversation.event_id is None:
            conversation.event = event
            conversation.save(update_fields=["event", "updated_at"])

        return success_response(
            data={
                "conversation_id": conversation.id,
                "event_id": conversation.event_id,
                "created": created,
            }
        )


class EventFriendshipRequestCreateView(APIView):
    """Create or re-send a friendship request tied to an event."""

    permission_classes = [IsAuthenticated]

    def get(self, request, event_id, target_username):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        User = get_user_model()
        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return error_response(message="User not found", status=404)

        if target_user == request.user:
            return error_response(
                message="Cannot check buddy status for yourself",
                status=400,
            )

        user1, user2 = sorted([request.user, target_user], key=lambda user: user.id)
        friendship = Friendship.objects.filter(user1=user1, user2=user2).first()

        if friendship is None:
            return success_response(data=None)

        if friendship.met_at_event_id is None:
            friendship.met_at_event = event
            friendship.save(update_fields=["met_at_event", "updated_at"])

        return success_response(
            data=FriendshipSerializer(friendship).data,
            message="Buddy status fetched",
        )

    def post(self, request, event_id, target_username):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        User = get_user_model()
        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return error_response(message="User not found", status=404)

        if target_user == request.user:
            return error_response(
                message="Cannot send a buddy request to yourself",
                status=400,
            )

        serializer = FriendshipRequestCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        user1, user2 = sorted([request.user, target_user], key=lambda user: user.id)
        friendship = Friendship.objects.filter(user1=user1, user2=user2).first()

        if friendship and friendship.status == Friendship.STATUS_ACCEPTED:
            return error_response(message="You are already buddies", status=409)

        if friendship and friendship.status == Friendship.STATUS_PENDING:
            return error_response(message="A buddy request is already pending", status=409)

        request_message = serializer.validated_data.get("request_message", "")
        if friendship:
            friendship.request_sender = request.user
            friendship.request_message = request_message
            friendship.status = Friendship.STATUS_PENDING
            friendship.accepted_at = None
            friendship.met_at_event = event
            friendship.save(
                update_fields=[
                    "request_sender",
                    "request_message",
                    "status",
                    "accepted_at",
                    "met_at_event",
                    "updated_at",
                ]
            )
        else:
            friendship = Friendship.objects.create(
                user1=user1,
                user2=user2,
                request_sender=request.user,
                request_message=request_message,
                status=Friendship.STATUS_PENDING,
                met_at_event=event,
            )

        return success_response(
            data=FriendshipSerializer(friendship).data,
            message="Buddy request sent",
            status=201,
        )

    def patch(self, request, event_id, target_username):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        User = get_user_model()
        try:
            target_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return error_response(message="User not found", status=404)

        if target_user == request.user:
            return error_response(
                message="Cannot update buddy status for yourself",
                status=400,
            )

        serializer = FriendshipActionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        user1, user2 = sorted([request.user, target_user], key=lambda user: user.id)
        friendship = Friendship.objects.filter(user1=user1, user2=user2).first()
        if friendship is None:
            return error_response(message="Buddy request not found", status=404)

        action = serializer.validated_data["action"]

        if action == "withdraw":
            if friendship.status != Friendship.STATUS_PENDING:
                return error_response(message="Only pending buddy requests can be withdrawn", status=400)
            if friendship.request_sender_id != request.user.id:
                return error_response(message="Only the sender can withdraw this buddy request", status=403)

            friendship.status = Friendship.STATUS_CANCELLED
            friendship.accepted_at = None
            friendship.met_at_event = friendship.met_at_event or event
            friendship.save(update_fields=["status", "accepted_at", "met_at_event", "updated_at"])
            return success_response(
                data=FriendshipSerializer(friendship).data,
                message="Buddy request withdrawn",
            )

        if action == "unfriend":
            if friendship.status != Friendship.STATUS_ACCEPTED:
                return error_response(message="Only accepted buddies can be removed", status=400)

            friendship.status = Friendship.STATUS_CANCELLED
            friendship.accepted_at = None
            friendship.met_at_event = friendship.met_at_event or event
            friendship.save(update_fields=["status", "accepted_at", "met_at_event", "updated_at"])
            return success_response(
                data=FriendshipSerializer(friendship).data,
                message="Buddy removed",
            )

        if friendship.status != Friendship.STATUS_PENDING:
            return error_response(message="Only pending buddy requests can be accepted", status=400)
        if friendship.request_sender_id == request.user.id:
            return error_response(message="You cannot accept your own buddy request", status=403)

        friendship.status = Friendship.STATUS_ACCEPTED
        friendship.accepted_at = timezone.now()
        friendship.met_at_event = friendship.met_at_event or event
        friendship.save(update_fields=["status", "accepted_at", "met_at_event", "updated_at"])
        return success_response(
            data=FriendshipSerializer(friendship).data,
            message="Buddy request accepted",
        )


class MyFriendshipsView(APIView):
    """List current user's friendships: accepted buddies and pending requests."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: FriendshipSerializer(many=True)})
    def get(self, request):
        user = request.user
        qs = (
            Friendship.objects.filter(Q(user1=user) | Q(user2=user))
            .select_related("user1", "user2", "request_sender", "met_at_event")
            .order_by("-updated_at")
        )
        accepted = []
        pending_incoming = []
        pending_outgoing = []
        for f in qs:
            data = FriendshipSerializer(f, context={"request": request}).data
            if f.status == Friendship.STATUS_ACCEPTED:
                accepted.append(data)
            elif f.status == Friendship.STATUS_PENDING:
                if f.request_sender_id == user.id:
                    pending_outgoing.append(data)
                else:
                    pending_incoming.append(data)
        return success_response(
            data={
                "accepted": accepted,
                "pending_incoming": pending_incoming,
                "pending_outgoing": pending_outgoing,
            }
        )


def _network_person(user, request, event_id=None, event_title=None):
    """Build a minimal person dict for network responses."""
    profile = getattr(user, "profile", None)
    avatar = None
    if profile and profile.avatar:
        avatar = request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url
    out = {
        "id": user.id,
        "username": user.username,
        "first_name": getattr(user, "first_name", "") or "",
        "last_name": getattr(user, "last_name", "") or "",
        "avatar": avatar,
    }
    if event_id is not None:
        out["event_id"] = event_id
    if event_title:
        out["event_title"] = event_title
    return out


class MyNetworkPeopleView(APIView):
    """
    List people in the current user's network:
    - friends: accepted friendships (buddies)
    - went_to_events_with: people who had a used ticket to the same event(s) as me (excluding friends)
    - hosts_met: hosts of events I attended (used ticket)
    - vendors_met: vendors assigned to needs at events I attended
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Event IDs where I have a used ticket
        my_used_event_ids = set(
            Ticket.objects.filter(goer=user, status="used")
            .values_list("event_id", flat=True)
            .distinct()
        )
        # Friend user IDs (other side of accepted friendships)
        friend_ids = set()
        friends_data = []
        for f in Friendship.objects.filter(
            (Q(user1=user) | Q(user2=user)),
            status=Friendship.STATUS_ACCEPTED,
        ).select_related("user1", "user2", "met_at_event"):
            other = f.user2 if f.user1_id == user.id else f.user1
            friend_ids.add(other.id)
            event_id = f.met_at_event_id if f.met_at_event_id else None
            event_title = f.met_at_event.title if f.met_at_event else None
            friends_data.append(_network_person(other, request, event_id=event_id, event_title=event_title))

        # Went to events with: same event, used ticket, not me, not already a friend
        went_with_data = []
        seen_went_with = set()
        if my_used_event_ids:
            other_tickets = (
                Ticket.objects.filter(
                    event_id__in=my_used_event_ids,
                    status="used",
                )
                .exclude(goer=user)
                .exclude(goer_id__in=friend_ids)
                .select_related("goer", "event")
            )
            for tick in other_tickets:
                if tick.goer_id in seen_went_with:
                    continue
                seen_went_with.add(tick.goer_id)
                went_with_data.append(
                    _network_person(
                        tick.goer,
                        request,
                        event_id=tick.event_id,
                        event_title=tick.event.title,
                    )
                )

        # Hosts of events I attended
        hosts_met_data = []
        seen_hosts = set()
        if my_used_event_ids:
            events_with_host = Event.objects.filter(
                id__in=my_used_event_ids,
            ).exclude(host=user).select_related("host")
            for ev in events_with_host:
                if ev.host_id in seen_hosts:
                    continue
                seen_hosts.add(ev.host_id)
                hosts_met_data.append(
                    _network_person(ev.host, request, event_id=ev.id, event_title=ev.title)
                )

        # Vendors assigned to needs at events I attended
        vendors_met_data = []
        seen_vendors = set()
        if my_used_event_ids:
            needs = EventNeed.objects.filter(
                event_id__in=my_used_event_ids,
                assigned_vendor__isnull=False,
            ).exclude(assigned_vendor=user).select_related("assigned_vendor", "event")
            for need in needs:
                vid = need.assigned_vendor_id
                if vid in seen_vendors:
                    continue
                seen_vendors.add(vid)
                vendors_met_data.append(
                    _network_person(
                        need.assigned_vendor,
                        request,
                        event_id=need.event_id,
                        event_title=need.event.title,
                    )
                )

        return success_response(
            data={
                "friends": friends_data,
                "went_to_events_with": went_with_data,
                "hosts_met": hosts_met_data,
                "vendors_met": vendors_met_data,
            }
        )


def _network_activity_actor(user):
    """Minimal actor dict for network activity."""
    return {
        "id": user.id,
        "username": user.username,
        "first_name": getattr(user, "first_name", "") or "",
        "last_name": getattr(user, "last_name", "") or "",
    }


def _event_subtitle(event):
    """Build a short event subtitle: e.g. 'Sat · 8:00 PM · Indiranagar'."""
    start = event.start_time
    if timezone.is_naive(start):
        start = timezone.make_aware(start)
    time_str = start.strftime("%a · %I:%M %p")
    location = (event.location_name or "").strip() or "TBD"
    return f"{time_str} · {location}"


class MyNetworkActivityView(APIView):
    """
    List recent activity from the current user's network for 'The network is not static':
    - hosting: someone in my network is hosting an event (published)
    - going: someone in my network has a ticket (active or used) to an event
    - interested: someone in my network marked interest in an event
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        my_used_event_ids = set(
            Ticket.objects.filter(goer=user, status="used")
            .values_list("event_id", flat=True)
            .distinct()
        )
        friend_ids = set()
        for f in Friendship.objects.filter(
            (Q(user1=user) | Q(user2=user)),
            status=Friendship.STATUS_ACCEPTED,
        ):
            other_id = f.user2_id if f.user1_id == user.id else f.user1_id
            friend_ids.add(other_id)
        went_with_ids = set()
        if my_used_event_ids:
            went_with_ids = set(
                Ticket.objects.filter(
                    event_id__in=my_used_event_ids,
                    status="used",
                )
                .exclude(goer=user)
                .exclude(goer_id__in=friend_ids)
                .values_list("goer_id", flat=True)
                .distinct()
            )
        hosts_met_ids = set()
        vendors_met_ids = set()
        if my_used_event_ids:
            hosts_met_ids = set(
                Event.objects.filter(id__in=my_used_event_ids)
                .exclude(host=user)
                .values_list("host_id", flat=True)
                .distinct()
            )
            vendors_met_ids = set(
                EventNeed.objects.filter(
                    event_id__in=my_used_event_ids,
                    assigned_vendor__isnull=False,
                )
                .values_list("assigned_vendor_id", flat=True)
                .distinct()
            )
        network_user_ids = friend_ids | went_with_ids | hosts_met_ids | vendors_met_ids
        network_user_ids.discard(user.id)

        activity_items = []
        limit = 20

        # Hosting: events hosted by someone in network (published), ordered by created_at
        hosting_events = (
            Event.objects.filter(
                host_id__in=network_user_ids,
                status="published",
            )
            .select_related("host")
            .order_by("-created_at")[:limit]
        )
        for event in hosting_events:
            activity_items.append({
                "kind": "hosting",
                "actor": _network_activity_actor(event.host),
                "event_id": event.id,
                "event_title": event.title,
                "event_subtitle": _event_subtitle(event),
                "happened_at": event.created_at.isoformat(),
            })

        # Going: tickets (active or used) where goer is in network, event published
        going_tickets = (
            Ticket.objects.filter(
                goer_id__in=network_user_ids,
                status__in=["active", "used"],
            )
            .select_related("goer", "event")
            .filter(event__status="published")
            .order_by("-purchased_at")[:limit * 2]
        )
        for tick in going_tickets:
            when = tick.used_at or tick.purchased_at
            if when:
                activity_items.append({
                    "kind": "going",
                    "actor": _network_activity_actor(tick.goer),
                    "event_id": tick.event_id,
                    "event_title": tick.event.title,
                    "event_subtitle": _event_subtitle(tick.event),
                    "happened_at": when.isoformat() if hasattr(when, "isoformat") else str(when),
                })

        # Interested: EventInterest where user in network
        interests = (
            EventInterest.objects.filter(user_id__in=network_user_ids)
            .select_related("user", "event")
            .order_by("-created_at")[:limit]
        )
        for interest in interests:
            if interest.event.status != "published":
                continue
            activity_items.append({
                "kind": "interested",
                "actor": _network_activity_actor(interest.user),
                "event_id": interest.event_id,
                "event_title": interest.event.title,
                "event_subtitle": _event_subtitle(interest.event),
                "happened_at": interest.created_at.isoformat(),
            })

        activity_items.sort(key=lambda x: x["happened_at"], reverse=True)
        activity_items = activity_items[:limit]

        return success_response(data={"activity": activity_items})
