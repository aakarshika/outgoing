"""Views for the home feed endpoint."""

from datetime import datetime, time, timedelta
from math import cos, radians

from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from api.v1.events.serializers import EventListSerializer
from api.v1.profiles.serializers import IconicHostSerializer
from api.v1.vendors.serializers import VendorServiceSerializer
from apps.events.models import Event, EventView
from apps.profiles.models import UserProfile
from apps.vendors.models import VendorService
from core.responses import success_response


class FeedView(APIView):
    """Home feed — returns enriched events for Event Card rendering."""

    permission_classes = [AllowAny]

    def _apply_geo_filter(self, events, request):
        """Filter events by a rough geo bounding box around lat/lng."""
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        if lat is None or lng is None:
            return events

        try:
            latitude = float(lat)
            longitude = float(lng)
            radius_km = float(request.query_params.get("radius_km", 25))
        except (TypeError, ValueError):
            return events

        radius_km = max(1.0, min(radius_km, 200.0))
        lat_delta = radius_km / 111.0
        lng_scale = max(0.1, cos(radians(latitude)))
        lng_delta = radius_km / (111.0 * lng_scale)

        return events.filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=latitude - lat_delta,
            latitude__lte=latitude + lat_delta,
            longitude__gte=longitude - lng_delta,
            longitude__lte=longitude + lng_delta,
        )

    def _apply_weekend_filter(self, events, request):
        """Filter events happening this (or next) weekend."""
        weekend = request.query_params.get("weekend")
        if weekend != "true":
            return events

        now_local = timezone.localtime()
        weekday = now_local.weekday()  # Monday=0 ... Sunday=6
        days_until_saturday = 5 - weekday if weekday <= 5 else 6
        saturday_date = (now_local + timedelta(days=days_until_saturday)).date()
        monday_date = saturday_date + timedelta(days=2)

        start_dt = timezone.make_aware(datetime.combine(saturday_date, time.min))
        end_dt = timezone.make_aware(datetime.combine(monday_date, time.min))
        return events.filter(start_time__gte=start_dt, start_time__lt=end_dt)

    def get(self, request):
        """
        Get the home feed.
        Supports: ?category=, ?search=, ?sort=trending|newest|popular,
                  ?lat= & ?lng= & ?radius_km=, ?weekend=true,
                  ?featured=true, ?page=, ?page_size=
        """
        events = Event.objects.filter(
            lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
        ).select_related("host", "host__profile", "category")

        # Category filter
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

        events = self._apply_geo_filter(events, request)
        events = self._apply_weekend_filter(events, request)

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
        events_page = events[start : start + page_size]

        serializer = EventListSerializer(
            events_page, many=True, context={"request": request}
        )
        return success_response(
            data=serializer.data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )


class CarouselFeedView(APIView):
    """Carousel feed — returns a mix of upcoming top events and past event highlights."""

    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get the carousel events.
        Includes a few popular upcoming events, and a few completed events with highlights.
        """
        now = timezone.now()

        # 1. Top upcoming events (high interest, happening in the future)
        upcoming_events = Event.objects.filter(
            lifecycle_state__in=["published", "event_ready"], start_time__gte=now
        ).order_by("-interest_count")[:3]

        # 2. Top past events (completed, high interest)
        past_events = (
            Event.objects.filter(
                lifecycle_state="completed",
            )
            .exclude(id__in=[e.id for e in upcoming_events])
            .order_by("-interest_count")[:3]
        )

        # Combine and interleave them simply
        combined = list(upcoming_events) + list(past_events)

        # We might want to sort by start time, or just serve upcoming first.
        # For a carousel, a mixed order is sometimes nice, but let's just do upcoming then past.

        serializer = EventListSerializer(
            combined, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class RecentlyViewedFeedView(APIView):
    """Return the events a user has most recently viewed. Auth required."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get recently viewed events ordered by last_viewed_at descending."""
        page_size = int(request.query_params.get("page_size", 20))

        view_qs = (
            EventView.objects.filter(user=request.user)
            .select_related(
                "event", "event__host", "event__host__profile", "event__category"
            )
            .order_by("-last_viewed_at")[:page_size]
        )

        events = [ev.event for ev in view_qs]
        serializer = EventListSerializer(
            events, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class CompletedHighlightsFeedView(APIView):
    """Return completed events that have highlights or reviews — for 'Highlights & Rewinds'."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get completed events with highlight/review content."""
        page_size = int(request.query_params.get("page_size", 20))

        events = (
            Event.objects.filter(lifecycle_state="completed")
            .filter(Q(highlights__isnull=False) | Q(reviews__isnull=False))
            .distinct()
            .select_related("host", "host__profile", "category")
            .prefetch_related("media")
            .order_by("-interest_count", "-updated_at")[:page_size]
        )

        serializer = EventListSerializer(
            events, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class UpcomingFeedView(APIView):
    """Return upcoming published events ordered by start time."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get upcoming events sorted by start_time ascending."""
        now = timezone.now()
        page_size = int(request.query_params.get("page_size", 20))

        events = (
            Event.objects.filter(
                lifecycle_state__in=["published", "event_ready", "at_risk"],
                start_time__gte=now,
            )
            .select_related("host", "host__profile", "category")
            .order_by("start_time")[:page_size]
        )

        serializer = EventListSerializer(
            events, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class IconicHostsFeedView(APIView):
    """Return top hosts based on published events and reviews."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get the iconic hosts this week."""
        page_size = int(request.query_params.get("page_size", 10))

        # Annotate UserProfiles with event stats
        hosts = (
            UserProfile.objects.annotate(
                published_event_count=Count(
                    "user__hosted_events",
                    filter=Q(
                        user__hosted_events__lifecycle_state__in=[
                            "published",
                            "event_ready",
                            "completed",
                        ]
                    ),
                    distinct=True,
                ),
                review_count=Count("user__hosted_events__reviews", distinct=True),
                avg_rating=Avg("user__hosted_events__reviews__rating"),
            )
            .filter(published_event_count__gt=0)
            .order_by("-avg_rating", "-published_event_count", "-review_count", "-id")[
                :page_size
            ]
        )

        serializer = IconicHostSerializer(
            hosts, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)


class TopVendorsFeedView(APIView):
    """Return top vendor services based on events and reviews."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get the top rated vendors."""
        page_size = int(request.query_params.get("page_size", 10))

        vendors = (
            VendorService.objects.filter(is_active=True, visibility="customer_facing")
            .annotate(
                review_count=Count("reviews", distinct=True),
                avg_rating=Avg("reviews__rating"),
                event_count=Count(
                    "reviews__event", distinct=True
                ),  # Count distinct events they were reviewed on
            )
            .filter(
                review_count__gt=0
            )  # Only include vendors with reviews for top rated
            .order_by("-avg_rating", "-event_count", "-review_count", "-id")[:page_size]
        )

        serializer = VendorServiceSerializer(
            vendors, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)
