"""Views for the home feed endpoint."""

from datetime import datetime, time, timedelta
from math import cos, radians

from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Avg, Case, Count, IntegerField, Min, Q, Value, When
from django.db.models.functions import Coalesce
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from api.v1.events.serializers import EventHighlightSerializer, EventListSerializer
from api.v1.vendors.serializers import VendorServiceSerializer
from apps.events.models import Event, EventHighlight, EventView
from apps.vendors.models import VendorService
from core.responses import success_response
from core.utils import resolve_media_url


def _safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _haversine_distance_km(lat1, lng1, lat2, lng2):
    """Return great-circle distance in km for two lat/lng points."""
    from math import asin, sin, sqrt

    lat1_rad, lng1_rad, lat2_rad, lng2_rad = map(radians, [lat1, lng1, lat2, lng2])
    d_lat = lat2_rad - lat1_rad
    d_lng = lng2_rad - lng1_rad
    a = sin(d_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(d_lng / 2) ** 2
    c = 2 * asin(min(1, sqrt(a)))
    return 6371.0 * c


def _serialize_user(user, request):
    if not user:
        return None

    profile = getattr(user, "profile", None)
    avatar = resolve_media_url(profile.avatar, request) if profile and profile.avatar else None
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar": avatar,
    }


def _serialize_service(service, request):
    if not service:
        return None

    return {
        "id": service.id,
        "title": service.title,
        "description": service.description,
        "category": service.category,
        "visibility": service.visibility,
        "base_price": str(service.base_price) if service.base_price is not None else None,
        "portfolio_image": (
            resolve_media_url(service.portfolio_image, request)
            if service.portfolio_image
            else None
        ),
        "location_city": service.location_city,
        "is_active": service.is_active,
    }


class BaseFeedView(APIView):
    """Base feed endpoint with nested event/need/application/vendor metadata."""

    permission_classes = [AllowAny]

    SORT_POPULARITY = "popularity"
    SORT_DISTANCE = "distance"
    SORT_CREATED = "created"
    SORT_START_TIME = "start_time"
    ALLOWED_SORTS = {SORT_POPULARITY, SORT_DISTANCE, SORT_CREATED, SORT_START_TIME}

    def _parse_datetime_param(self, raw_value):
        if not raw_value:
            return None
        parsed = parse_datetime(raw_value)
        if parsed is None:
            return None
        if timezone.is_naive(parsed):
            return timezone.make_aware(parsed)
        return parsed

    def _apply_filters(self, events, request):
        # Online-only filter
        online_only = request.query_params.get("online") == "true"
        if online_only:
            events = events.filter(
                Q(location_address__iexact="online")
                | Q(location_address__iexact="online event")
            )

        # Prefer lifecycle_states (canonical). Legacy `status` matches the coarse Event.status column.
        lifecycle_csv = request.query_params.get("lifecycle_states", "").strip()
        if lifecycle_csv:
            allowed = {choice[0] for choice in Event.LIFECYCLE_CHOICES}
            states = [
                s.strip()
                for s in lifecycle_csv.split(",")
                if s.strip() in allowed
            ]
            if states:
                events = events.filter(lifecycle_state__in=states)
        else:
            status = request.query_params.get("status", "").strip()
            if status:
                statuses = [
                    value.strip() for value in status.split(",") if value.strip()
                ]
                if statuses:
                    events = events.filter(status__in=statuses)

        # Start time range filter
        start_at = self._parse_datetime_param(request.query_params.get("start_time_gte"))
        end_at = self._parse_datetime_param(request.query_params.get("start_time_lte"))
        if start_at is not None:
            events = events.filter(start_time__gte=start_at)
        if end_at is not None:
            events = events.filter(start_time__lte=end_at)

        # Category filter supports both category and categories (csv)
        category_single = request.query_params.get("category", "").strip()
        categories_csv = request.query_params.get("categories", "").strip()
        category_slugs = []
        if category_single:
            category_slugs.append(category_single)
        if categories_csv:
            category_slugs.extend(
                [value.strip() for value in categories_csv.split(",") if value.strip()]
            )
        if category_slugs:
            events = events.filter(category__slug__in=category_slugs)

        # Only free events (min ticket price == 0)
        free_only = request.query_params.get("free_only") == "true"
        if free_only:
            events = events.filter(
                Q(ticket_tiers__price=0)
                | Q(ticket_tiers__isnull=True, ticket_price_standard=0)
                | Q(ticket_tiers__isnull=True, ticket_price_standard__isnull=True)
            )

        # Only events with at least one need
        has_needs = request.query_params.get("has_needs") == "true"
        if has_needs:
            events = events.filter(needs__isnull=False)

        return events

    def _serialize_need(self, need, request):
        user = request.user
        applications_payload = []
        i_have_applied = False

        for application in need.applications.all():
            app_user = _serialize_user(application.vendor, request)
            app_service = _serialize_service(application.service, request)
            is_mine = bool(user.is_authenticated and application.vendor_id == user.id)
            i_have_applied = i_have_applied or is_mine

            applications_payload.append(
                {
                    "id": application.id,
                    "vendor": app_user,
                    "service": app_service,
                    "message": application.message,
                    "proposed_price": (
                        str(application.proposed_price)
                        if application.proposed_price is not None
                        else None
                    ),
                    "status": application.status,
                    "created_at": application.created_at,
                    "i_have_applied": is_mine,
                }
            )

        accepted_application = next(
            (
                app
                for app in need.applications.all()
                if app.status == "accepted"
                and need.assigned_vendor_id
                and app.vendor_id == need.assigned_vendor_id
            ),
            None,
        )

        assigned_vendor_payload = None
        if need.assigned_vendor:
            assigned_vendor_payload = {
                "user": _serialize_user(need.assigned_vendor, request),
                "service": _serialize_service(
                    accepted_application.service if accepted_application else None,
                    request,
                ),
                "i_am_assigned_vendor": bool(
                    user.is_authenticated and need.assigned_vendor_id == user.id
                ),
            }

        return {
            "id": need.id,
            "title": need.title,
            "description": need.description,
            "category": need.category,
            "criticality": need.criticality,
            "budget_min": str(need.budget_min) if need.budget_min is not None else None,
            "budget_max": str(need.budget_max) if need.budget_max is not None else None,
            "status": need.status,
            "application_count": need.application_count,
            "applications": applications_payload,
            "i_have_applied": i_have_applied,
            "assigned_vendor": assigned_vendor_payload,
            "created_at": need.created_at,
        }

    def _serialize_event(self, event, request, query_lat, query_lng):
        host_payload = _serialize_user(event.host, request)
        user = request.user

        ticket_tier_prices = [
            float(tier.price) for tier in event.ticket_tiers.all() if tier.price is not None
        ]
        if ticket_tier_prices:
            min_ticket_price = min(ticket_tier_prices)
        elif event.ticket_price_standard is None:
            min_ticket_price = 0.0
        else:
            min_ticket_price = float(event.ticket_price_standard)

        latitude = _safe_float(event.latitude)
        longitude = _safe_float(event.longitude)
        if query_lat is not None and query_lng is not None and latitude is not None and longitude is not None:
            distance_km = _haversine_distance_km(query_lat, query_lng, latitude, longitude)
        else:
            distance_km = None

        needs_payload = [self._serialize_need(need, request) for need in event.needs.all()]

        saved_count = int(event.interest_count or 0)
        tickets_sold_count = int(getattr(event, "sold_ticket_count", 0) or 0)
        highlights_count = int(getattr(event, "highlight_count", 0) or 0)
        review_count = int(getattr(event, "review_count", 0) or 0)
        popularity_score = (
            saved_count
            + (tickets_sold_count * 3)
            + (highlights_count * 2)
            + (review_count * 2)
        )

        i_have_ticket = False
        i_have_saved = False
        i_am_host = False
        if user.is_authenticated:
            i_have_ticket = event.tickets.filter(
                goer=user,
                status__in=["active", "used"],
            ).exists()
            i_have_saved = event.interests.filter(user=user).exists()
            i_am_host = event.host_id == user.id

        event_payload = {
            "id": event.id,
            "title": event.title,
            "slug": event.slug,
            "description": event.description,
            "status": event.status,
            "lifecycle_state": event.lifecycle_state,
            "category": {
                "id": event.category.id,
                "name": event.category.name,
                "slug": event.category.slug,
                "icon": event.category.icon,
            }
            if event.category
            else None,
            "location_name": event.location_name,
            "location_address": event.location_address,
            "latitude": latitude,
            "longitude": longitude,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "created_at": event.created_at,
            "ticket_price_standard": (
                str(event.ticket_price_standard)
                if event.ticket_price_standard is not None
                else None
            ),
            "ticket_price_flexible": (
                str(event.ticket_price_flexible)
                if event.ticket_price_flexible is not None
                else None
            ),
            "cover_image": resolve_media_url(event.cover_image, request)
            if event.cover_image
            else None,
            "capacity": event.capacity,
            "interest_count": saved_count,
            # `Event.ticket_count` is a denormalized field and may be stale in seeded/dev data.
            # Prefer the annotated sold_ticket_count used everywhere else in this view.
            "ticket_count": tickets_sold_count,
            "host": host_payload,
        }

        return {
            "event": event_payload,
            "needs": needs_payload,
            "host": host_payload,
            "event_popularity_score": popularity_score,
            "tickets_sold_count": tickets_sold_count,
            "saved_count": saved_count,
            "highlights_count": highlights_count,
            "review_count": review_count,
            "min_ticket_price": min_ticket_price,
            "i_am_host": i_am_host,
            "i_have_ticket": i_have_ticket,
            "i_have_saved": i_have_saved,
            "distance_km": distance_km,
        }

    def get(self, request):
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        page = max(page, 1)
        page_size = max(1, min(page_size, 100))

        sort = request.query_params.get("sort", self.SORT_POPULARITY)
        if sort not in self.ALLOWED_SORTS:
            sort = self.SORT_POPULARITY

        query_lat = _safe_float(request.query_params.get("lat"))
        query_lng = _safe_float(request.query_params.get("lng"))
        include_host_drafts = (
            request.user.is_authenticated
            and request.query_params.get("include_host_drafts") == "true"
        )

        lifecycle_filter = Q(lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES)
        if include_host_drafts:
            lifecycle_filter |= Q(host=request.user, lifecycle_state="draft")

        events = (
            Event.objects.select_related("host", "host__profile", "category")
            .prefetch_related(
                "ticket_tiers",
                "tickets",
                "interests",
                "needs",
                "needs__assigned_vendor",
                "needs__assigned_vendor__profile",
                "needs__applications",
                "needs__applications__vendor",
                "needs__applications__vendor__profile",
                "needs__applications__service",
            )
            .filter(lifecycle_filter)
            .annotate(
                sold_ticket_count=Count(
                    "tickets",
                    filter=Q(tickets__status__in=["active", "used"]),
                    distinct=True,
                ),
                highlight_count=Count(
                    "highlights",
                    filter=Q(highlights__moderation_status="approved"),
                    distinct=True,
                ),
                review_count=Count(
                    "reviews",
                    filter=Q(reviews__is_public=True),
                    distinct=True,
                ),
                min_tier_price=Min("ticket_tiers__price"),
            )
            .distinct()
        )

        events = self._apply_filters(events, request)

        # Revised geo rules:
        # - If ONLY lat/lng are provided (no other filters), sort purely by distance.
        # - If lat/lng plus other filters are provided, first restrict results to a
        #   100-mile radius, then apply the requested sort/filtering normally.
        if query_lat is not None and query_lng is not None:
            # Treat these as "filters" for the purpose of geo behavior.
            has_other_filters = any(
                [
                    request.query_params.get("online") == "true",
                    bool(request.query_params.get("lifecycle_states", "").strip()),
                    bool(request.query_params.get("status", "").strip()),
                    request.query_params.get("include_host_drafts") == "true",
                    bool(request.query_params.get("start_time_gte")),
                    bool(request.query_params.get("start_time_lte")),
                    bool(request.query_params.get("category", "").strip()),
                    bool(request.query_params.get("categories", "").strip()),
                    request.query_params.get("free_only") == "true",
                    request.query_params.get("has_needs") == "true",
                ]
            )

            if has_other_filters:
                radius_km = 160.934  # 100 miles
                lat_delta = radius_km / 111.0
                lng_scale = max(0.1, cos(radians(query_lat)))
                lng_delta = radius_km / (111.0 * lng_scale)
                events = events.filter(
                    latitude__isnull=False,
                    longitude__isnull=False,
                    latitude__gte=query_lat - lat_delta,
                    latitude__lte=query_lat + lat_delta,
                    longitude__gte=query_lng - lng_delta,
                    longitude__lte=query_lng + lng_delta,
                )
            else:
                # Only coords given: enforce distance sorting.
                sort = self.SORT_DISTANCE

        if sort == self.SORT_CREATED:
            events = events.order_by("-created_at", "-id")
            total_count = events.count()
            start = (page - 1) * page_size
            paged_events = list(events[start : start + page_size])
        elif sort == self.SORT_START_TIME:
            events = events.order_by("start_time", "-id")
            total_count = events.count()
            start = (page - 1) * page_size
            paged_events = list(events[start : start + page_size])
        elif sort == self.SORT_DISTANCE:
            # Distance sort requires caller coordinates; fallback to popularity if missing.
            if query_lat is None or query_lng is None:
                sort = self.SORT_POPULARITY
            else:
                all_events = list(events)
                payload_rows = [
                    self._serialize_event(event, request, query_lat, query_lng)
                    for event in all_events
                ]
                payload_rows.sort(
                    key=lambda row: (
                        row["distance_km"] is None,
                        row["distance_km"] if row["distance_km"] is not None else float("inf"),
                        -row["event_popularity_score"],
                    )
                )
                total_count = len(payload_rows)
                start = (page - 1) * page_size
                data = payload_rows[start : start + page_size]
                return success_response(
                    data=data,
                    meta={"page": page, "page_size": page_size, "total_count": total_count},
                )

        if sort == self.SORT_POPULARITY:
            events = events.order_by(
                "-interest_count",
                "-sold_ticket_count",
                "-highlight_count",
                "-review_count",
                "-created_at",
            )
            total_count = events.count()
            start = (page - 1) * page_size
            paged_events = list(events[start : start + page_size])

        data = [
            self._serialize_event(event, request, query_lat, query_lng)
            for event in paged_events
        ]
        return success_response(
            data=data,
            meta={"page": page, "page_size": page_size, "total_count": total_count},
        )


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

    def _parse_datetime_param(self, raw_value):
        """Parse an ISO datetime query param into an aware datetime."""
        if not raw_value:
            return None

        parsed = parse_datetime(raw_value)
        if parsed is None:
            return None
        if timezone.is_naive(parsed):
            return timezone.make_aware(parsed)
        return parsed

    def _apply_lifecycle_filter(self, events, request):
        """Apply explicit lifecycle-state filtering when requested."""
        raw_states = request.query_params.get("lifecycle_states", "").strip()
        if not raw_states:
            return events.filter(lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES)

        allowed_states = {choice[0] for choice in Event.LIFECYCLE_CHOICES}
        states = [
            state.strip()
            for state in raw_states.split(",")
            if state.strip() in allowed_states
        ]
        if not states:
            return events.none()
        return events.filter(lifecycle_state__in=states)

    def _apply_start_time_range_filter(self, events, request):
        """Filter by start_time range when provided."""
        start_at = self._parse_datetime_param(request.query_params.get("start_time_gte"))
        end_at = self._parse_datetime_param(request.query_params.get("start_time_lte"))

        if start_at is None and end_at is None:
            return events

        if not request.query_params.get("lifecycle_states", "").strip():
            events = events.exclude(lifecycle_state="draft")

        if start_at is not None:
            events = events.filter(start_time__gte=start_at)
        if end_at is not None:
            events = events.filter(start_time__lt=end_at)
        return events

    def get(self, request):
        """
        Get the home feed.
        Supports: ?category=, ?search=, ?sort=trending|newest|popular,
                  ?lat= & ?lng= & ?radius_km=, ?weekend=true,
                  ?featured=true, ?page=, ?page_size=
        """
        events = Event.objects.select_related("host", "host__profile", "category")
        events = self._apply_lifecycle_filter(events, request)

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
            
        location = request.query_params.get("location")
        if location:
            # Event model does not have city/state fields; keep this scoped
            # to known text fields so the ORM doesn't error.
            events = events.filter(
                Q(location_name__icontains=location)
                | Q(location_address__icontains=location)
            )
            
        is_online = request.query_params.get("online")
        if is_online == "true":
            # SQLite doesn't support __contains with a list/choice on JSON fields well.
            # We search for the string 'online' within the JSON text or location fields.
            events = events.filter(
                Q(location_address__icontains="online event") |
                Q(tags__icontains="online")
            )

        events = self._apply_geo_filter(events, request)
        events = self._apply_weekend_filter(events, request)
        events = self._apply_start_time_range_filter(events, request)

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
    """Return all completed events — for 'Highlights & Rewinds'."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get completed events ordered by recently completed."""
        page_size = int(request.query_params.get("page_size", 20))

        events = (
            Event.objects.filter(lifecycle_state="completed")
            .select_related("host", "host__profile", "category")
            .prefetch_related("media")
            .order_by("-end_time")[:page_size]
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
        page_size = int(request.query_params.get("page_size", 150))
        User = get_user_model()

        # Build from users directly so hosts without UserProfile still appear.
        hosts = (
            User.objects.annotate(
                published_event_count=Count(
                    "hosted_events",
                    filter=Q(
                        hosted_events__lifecycle_state__in=[
                            "published",
                            "event_ready",
                            "completed",
                        ]
                    ),
                    distinct=True,
                ),
                non_draft_event_count=Count(
                    "hosted_events",
                    filter=~Q(hosted_events__lifecycle_state="draft"),
                    distinct=True,
                ),
                review_count=Count("hosted_events__reviews", distinct=True),
                avg_rating=Avg("hosted_events__reviews__rating"),
                avatar=models.F("profile__avatar"),
                headline=models.F("profile__headline"),
                location_city=models.F("profile__location_city"),
                iconic_tier=Case(
                    When(
                        published_event_count__gt=0,
                        review_count__gt=0,
                        then=Value(3),
                    ),
                    When(non_draft_event_count__gt=0, published_event_count__gt=0, then=Value(2)),
                    When(non_draft_event_count__gt=0, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            )
            # Include any host with at least one non-draft event, then rank by iconicity.
            .filter(non_draft_event_count__gt=0)
            .order_by(
                "-iconic_tier",
                Coalesce("avg_rating", Value(0.0)).desc(),
                "-published_event_count",
                "-non_draft_event_count",
                "-review_count",
                "-id",
            )[
                :page_size
            ]
        )

        data = [
            {
                "id": host.id,
                "username": host.username,
                "avatar": resolve_media_url(host.avatar, request) if host.avatar else None,
                "headline": host.headline,
                "location_city": host.location_city,
                "published_event_count": host.published_event_count,
                "review_count": host.review_count,
                "avg_rating": host.avg_rating,
            }
            for host in hosts
        ]

        return success_response(data=data)


class TopVendorsFeedView(APIView):
    """Return top vendor services based on events and reviews."""

    permission_classes = [AllowAny]

    def get(self, request):
        """Get the top rated vendors."""
        page_size = int(request.query_params.get("page_size", 50))

        vendors = (
            VendorService.objects.filter(is_active=True, visibility="customer_facing")
            .annotate(
                review_count=Count("reviews", distinct=True),
                avg_rating=Avg("reviews__rating"),
                event_count=Count(
                    "reviews__event", distinct=True
                ),  # Count distinct events they were reviewed on
                iconic_tier=Case(
                    When(review_count__gt=0, event_count__gt=0, then=Value(2)),
                    When(review_count__gt=0, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
            )
            # Keep iconic vendors first while allowing newer vendors to appear later.
            .order_by(
                "-iconic_tier",
                Coalesce("avg_rating", Value(0.0)).desc(),
                "-event_count",
                "-review_count",
                "-id",
            )[:page_size]
        )

        serializer = VendorServiceSerializer(
            vendors, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)

class TrendingHighlightsFeedView(APIView):
    """
    Trending Highlights — returns the most 'viral' highlights.
    Viral score = likes_count + (comments_count * 2)
    """

    permission_classes = [AllowAny]

    def get(self, request):
        """Get highlights ordered by viral score."""
        page_size = int(request.query_params.get("page_size", 20))

        highlights = (
            EventHighlight.objects.filter(moderation_status="approved")
            .annotate(
                likes_count_annotated=Count("likes", distinct=True),
                comments_count_annotated=Count("comments", distinct=True),
            )
            .annotate(
                viral_score=(
                    models.F("likes_count_annotated")
                    + (models.F("comments_count_annotated") * 2)
                )
            )
            .order_by("-viral_score", "-created_at")[:page_size]
        )

        serializer = EventHighlightSerializer(
            highlights, many=True, context={"request": request}
        )
        return success_response(data=serializer.data)
