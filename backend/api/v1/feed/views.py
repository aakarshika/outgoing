"""Views for the home feed endpoint."""

from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from api.v1.events.serializers import EventListSerializer
from apps.events.models import Event
from core.responses import success_response


class FeedView(APIView):
    """Home feed — returns enriched events for Event Card rendering."""

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get the home feed.
        Supports: ?category=, ?sort=trending|newest|popular,
                  ?featured=true, ?page=, ?page_size=
        """
        events = Event.objects.filter(status="published").select_related(
            "host", "host__profile", "category"
        )

        # Category filter
        category = request.query_params.get("category")
        if category:
            events = events.filter(category__slug=category)

        # Featured mode — return single top event
        featured = request.query_params.get("featured")
        if featured == "true":
            # Simple trending: highest interest_count among recent events
            top_event = events.order_by("-interest_count", "-created_at").first()
            if top_event:
                serializer = EventListSerializer(
                    top_event, context={"request": request}
                )
                return success_response(data=serializer.data)
            return success_response(data=None)

        # Sorting
        sort = request.query_params.get("sort", "trending")
        if sort == "newest":
            events = events.order_by("-created_at")
        elif sort == "popular":
            events = events.order_by("-interest_count", "-ticket_count")
        else:  # trending (default)
            # Simple trending: combination of interest + recency
            events = events.order_by("-interest_count", "-created_at")

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total_count = events.count()
        start = (page - 1) * page_size
        events_page = events[start:start + page_size]

        serializer = EventListSerializer(
            events_page, many=True, context={"request": request}
        )
        return success_response(
            data=serializer.data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )
