"""Views for event request endpoints."""

from django.db.models import F
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.requests.models import EventRequest, RequestUpvote, RequestWishlist
from core.responses import error_response, success_response

from .serializers import EventRequestCreateSerializer, EventRequestSerializer


class RequestListCreateView(APIView):
    """List or create event requests."""

    def get_permissions(self):
        """Public GET, auth POST."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        """List open event requests."""
        requests_qs = EventRequest.objects.filter(status="open").select_related(
            "requester", "category"
        )

        category = request.query_params.get("category")
        if category:
            requests_qs = requests_qs.filter(category__slug=category)

        sort = request.query_params.get("sort", "trending")
        if sort == "newest":
            requests_qs = requests_qs.order_by("-created_at")
        else:
            requests_qs = requests_qs.order_by("-upvote_count", "-created_at")

        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total_count = requests_qs.count()
        start = (page - 1) * page_size
        requests_page = requests_qs[start : start + page_size]

        serializer = EventRequestSerializer(
            requests_page, many=True, context={"request": request}
        )
        return success_response(
            data=serializer.data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )

    def post(self, request):
        """Create a new event request."""
        serializer = EventRequestCreateSerializer(data=request.data)
        if serializer.is_valid():
            event_request = serializer.save(requester=request.user)
            result = EventRequestSerializer(event_request, context={"request": request})
            return success_response(
                data=result.data, message="Request created", status=201
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class RequestUpvoteView(APIView):
    """Toggle upvote on an event request."""

    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        """Upvote a request."""
        try:
            event_request = EventRequest.objects.get(pk=request_id)
        except EventRequest.DoesNotExist:
            return error_response(message="Request not found", status=404)

        _, created = RequestUpvote.objects.get_or_create(
            request=event_request, user=request.user
        )
        if not created:
            return error_response(message="Already upvoted", status=409)

        EventRequest.objects.filter(pk=request_id).update(
            upvote_count=F("upvote_count") + 1
        )
        event_request.refresh_from_db()
        return success_response(
            data={"upvote_count": event_request.upvote_count}, status=201
        )

    def delete(self, request, request_id):
        """Remove upvote from a request."""
        try:
            event_request = EventRequest.objects.get(pk=request_id)
        except EventRequest.DoesNotExist:
            return error_response(message="Request not found", status=404)

        deleted, _ = RequestUpvote.objects.filter(
            request=event_request, user=request.user
        ).delete()
        if not deleted:
            return error_response(message="Not upvoted", status=404)

        EventRequest.objects.filter(pk=request_id).update(
            upvote_count=F("upvote_count") - 1
        )
        event_request.refresh_from_db()
        return success_response(data={"upvote_count": event_request.upvote_count})


class RequestWishlistView(APIView):
    """Create, update, or remove the current user's wishlist entry for a request."""

    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        """Add request to current user's wishlist, or update wishlist intent."""
        try:
            event_request = EventRequest.objects.get(pk=request_id)
        except EventRequest.DoesNotExist:
            return error_response(message="Request not found", status=404)

        wishlist_as = request.data.get("wishlist_as")
        allowed_values = {choice[0] for choice in RequestWishlist.WISHLIST_AS_CHOICES}
        if wishlist_as not in allowed_values:
            return error_response(
                message="Validation Error",
                errors={"wishlist_as": ["Must be one of: goer, host, vendor."]},
            )

        wishlist, _ = RequestWishlist.objects.update_or_create(
            request=event_request,
            user=request.user,
            defaults={"wishlist_as": wishlist_as},
        )
        return success_response(
            data={"wishlist_as": wishlist.wishlist_as},
            message="Wishlist updated",
            status=201,
        )

    def delete(self, request, request_id):
        """Remove request from current user's wishlist."""
        deleted, _ = RequestWishlist.objects.filter(
            request_id=request_id, user=request.user
        ).delete()
        if not deleted:
            return error_response(message="Request not in wishlist", status=404)
        return success_response(message="Removed from wishlist")
