"""Views for event series endpoints."""

from datetime import datetime, timedelta

from dateutil.rrule import rrulestr
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventSeries
from apps.needs.models import EventNeed
from core.responses import error_response, success_response

from .serializers import (
    EventListSerializer,
    EventSeriesDetailSerializer,
    EventSeriesSerializer,
)


class EventSeriesListCreateView(APIView):
    """List or create an event series."""

    parser_classes = [JSONParser]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=EventSeriesSerializer, responses={201: EventSeriesSerializer}
    )
    def post(self, request):
        """Create a new event series template. Host only."""
        serializer = EventSeriesSerializer(data=request.data)
        if serializer.is_valid():
            series = serializer.save(host=request.user)
            return success_response(
                data=EventSeriesSerializer(series).data,
                message="Event series created",
                status=201,
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class EventSeriesDetailView(APIView):
    """Retrieve or update an event series."""

    parser_classes = [JSONParser]

    def get_permissions(self):
        """Public for GET, auth for PATCH."""
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(responses={200: EventSeriesDetailSerializer})
    def get(self, request, series_id):
        """Get full series detail."""
        try:
            series = EventSeries.objects.prefetch_related("need_templates").get(
                pk=series_id
            )
        except EventSeries.DoesNotExist:
            return error_response(message="Event series not found", status=404)

        serializer = EventSeriesDetailSerializer(series, context={"request": request})
        return success_response(data=serializer.data)

    @extend_schema(
        request=EventSeriesSerializer, responses={200: EventSeriesSerializer}
    )
    def patch(self, request, series_id):
        """Update event series defaults. Host only."""
        try:
            series = EventSeries.objects.get(pk=series_id)
        except EventSeries.DoesNotExist:
            return error_response(message="Event series not found", status=404)

        if series.host != request.user:
            return error_response(message="Not authorized", status=403)

        serializer = EventSeriesSerializer(series, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response(
                data=EventSeriesSerializer(series).data, message="Event series updated"
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class EventSeriesOccurrencesView(APIView):
    """List occurrences for an event series."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: EventListSerializer(many=True)})
    def get(self, request, series_id):
        """Get all occurrences for a series."""
        try:
            series = EventSeries.objects.get(pk=series_id)
        except EventSeries.DoesNotExist:
            return error_response(message="Event series not found", status=404)

        events = (
            Event.objects.filter(series=series)
            .select_related("host", "host__profile", "category")
            .order_by("start_time")
        )

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


class EventSeriesGenerateView(APIView):
    """Generate occurrences for an event series."""

    permission_classes = [IsAuthenticated]

    def post(self, request, series_id):  # noqa: C901
        """Generate occurrences from series RRULE."""
        try:
            series = EventSeries.objects.get(pk=series_id)
        except EventSeries.DoesNotExist:
            return error_response(message="Event series not found", status=404)

        if series.host != request.user:
            return error_response(message="Not authorized", status=403)

        generate_until_str = request.data.get("generate_until")
        generate_count = int(request.data.get("generate_count", 5))  # fallback
        clone_need_templates = request.data.get("clone_need_templates", True)

        if not series.recurrence_rule:
            return error_response(
                message="No recurrence rule set on series", status=400
            )

        try:
            # Simple RRULE parsing
            dtstart = timezone.now()
            rule = rrulestr(series.recurrence_rule, dtstart=dtstart)

            if generate_until_str:
                generate_until = datetime.fromisoformat(
                    generate_until_str.replace("Z", "+00:00")
                )
                dates = list(rule.between(dtstart, generate_until, inc=True))
            else:
                # Generate next N
                dates = []
                for i, dt in enumerate(rule):
                    if i >= generate_count:
                        break
                    dates.append(dt)
        except Exception as strerr:
            return error_response(message=f"Invalid RRULE: {strerr}", status=400)

        # We need a base category from an existing occurrence or request body...
        # Actually, Event needs a category. The EventSeries model doesn't hold it right now,
        # so let's get it from the latest occurrence or require it.
        # Let's get the earliest existing occurrence for template data.
        base_event = Event.objects.filter(series=series).order_by("created_at").first()
        category = base_event.category if base_event else None

        if not category and "category_id" in request.data:
            from apps.events.models import EventCategory

            category = EventCategory.objects.filter(
                pk=request.data["category_id"]
            ).first()

        if not category:
            return error_response(
                message="Cannot generate without a base category. Provide category_id or create a manual occurrence first.",
                status=400,
            )

        generated_events = []
        with transaction.atomic():
            # Get the highest occurrence_index currently
            last_event = (
                Event.objects.filter(series=series)
                .order_by("-occurrence_index")
                .first()
            )
            next_index = (last_event.occurrence_index or 0) + 1 if last_event else 1

            # Usually events are e.g 2 hours long
            duration = timedelta(hours=2)
            if base_event:
                duration = base_event.end_time - base_event.start_time

            for dt in dates:
                # Idempotency check
                if Event.objects.filter(series=series, start_time=dt).exists():
                    continue

                title = f"{series.name} #{next_index}"

                new_event = Event.objects.create(
                    host=series.host,
                    series=series,
                    occurrence_index=next_index,
                    title=title,
                    description=series.description,
                    category=category,
                    location_name=series.default_location_name,
                    location_address=series.default_location_address,
                    start_time=dt,
                    end_time=dt + duration,
                    capacity=series.default_capacity,
                    ticket_price_standard=series.default_ticket_price_standard,
                    ticket_price_flexible=series.default_ticket_price_flexible,
                    status="draft",
                    lifecycle_state="draft",
                )
                generated_events.append(new_event)
                next_index += 1

                if clone_need_templates:
                    for template in series.need_templates.all():
                        EventNeed.objects.create(
                            event=new_event,
                            title=template.title,
                            description=template.description,
                            category=template.category,
                            criticality=template.criticality,
                            budget_min=template.budget_min,
                            budget_max=template.budget_max,
                            status="open",
                        )

            # If this is just a preview, rollback the transaction so nothing is saved
            if request.data.get("preview"):
                transaction.set_rollback(True)

        serializer = EventListSerializer(
            generated_events, many=True, context={"request": request}
        )
        message = "Previewed" if request.data.get("preview") else "Generated"
        return success_response(
            data=serializer.data,
            message=f"{message} {len(generated_events)} occurrences",
            status=200 if request.data.get("preview") else 201,
        )
