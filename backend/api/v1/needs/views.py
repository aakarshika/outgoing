"""Views for event needs and applications."""

from django.db.models import F
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event
from apps.needs.models import EventNeed, NeedApplication
from apps.vendors.models import VendorService
from core.responses import error_response, success_response

from .serializers import (
    EventNeedCreateSerializer,
    EventNeedSerializer,
    NeedApplicationCreateSerializer,
    NeedApplicationSerializer,
)


class EventNeedsView(APIView):
    """List or create needs for a specific event."""

    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        """List needs for an event."""
        needs = EventNeed.objects.filter(event_id=event_id).prefetch_related(
            "applications"
        )
        serializer = EventNeedSerializer(needs, many=True)
        return success_response(data=serializer.data)

    def post(self, request, event_id):
        """Create a need. Event host only."""
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return error_response(message="Event not found", status=404)

        if event.host != request.user:
            return error_response(message="Not authorized", status=403)

        serializer = EventNeedCreateSerializer(data=request.data)
        if serializer.is_valid():
            need = serializer.save(event=event)
            result = EventNeedSerializer(need)
            return success_response(data=result.data, message="Need created", status=201)
        return error_response(message="Validation Error", errors=serializer.errors)


class NeedApplyView(APIView):
    """Apply to fill an event need."""

    permission_classes = [IsAuthenticated]

    def post(self, request, need_id):
        """Submit application to a need."""
        try:
            need = EventNeed.objects.get(pk=need_id, status="open")
        except EventNeed.DoesNotExist:
            return error_response(message="Need not found or not open", status=404)

        if NeedApplication.objects.filter(need=need, vendor=request.user).exists():
            return error_response(message="Already applied", status=400)

        serializer = NeedApplicationCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        service = None
        service_id = serializer.validated_data.get("service_id")
        if service_id:
            try:
                service = VendorService.objects.get(pk=service_id, vendor=request.user)
            except VendorService.DoesNotExist:
                return error_response(message="Service not found", status=404)

        application = NeedApplication.objects.create(
            need=need,
            vendor=request.user,
            service=service,
            message=serializer.validated_data.get("message", ""),
            proposed_price=serializer.validated_data.get("proposed_price"),
        )

        EventNeed.objects.filter(pk=need_id).update(
            application_count=F("application_count") + 1
        )

        result = NeedApplicationSerializer(application)
        return success_response(data=result.data, message="Application submitted", status=201)


class NeedApplicationReviewView(APIView):
    """Accept or reject a need application (event host only)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):
        """Update application status."""
        try:
            application = NeedApplication.objects.select_related(
                "need__event"
            ).get(pk=application_id)
        except NeedApplication.DoesNotExist:
            return error_response(message="Application not found", status=404)

        if application.need.event.host != request.user:
            return error_response(message="Not authorized", status=403)

        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return error_response(message="Status must be 'accepted' or 'rejected'", status=400)

        application.status = new_status
        application.save()

        if new_status == "accepted":
            need = application.need
            need.status = "filled"
            need.assigned_vendor = application.vendor
            need.save()

        return success_response(
            message=f"Application {new_status}",
            data=NeedApplicationSerializer(application).data,
        )

class MyNeedApplicationsView(APIView):
    """List need applications submitted by the authenticated vendor."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List my applications."""
        applications = NeedApplication.objects.filter(vendor=request.user).select_related(
            "need", "need__event"
        )
        serializer = NeedApplicationSerializer(applications, many=True)
        return success_response(data=serializer.data)
