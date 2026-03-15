"""Views for event needs and applications."""

from django.db.models import Exists, F, OuterRef
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import Event
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.vendors.models import VendorService
from core.responses import error_response, success_response

from .serializers import (
    EventNeedCreateSerializer,
    EventNeedSerializer,
    NeedApplicationCreateSerializer,
    NeedApplicationSerializer,
    NeedInviteSerializer,
    EventNeedUpdateSerializer,
)


ACTIVE_OPPORTUNITY_STATUSES = ("open", "pending")


def _fallback_need_title(need):
    """Provide a readable title for legacy seed data with blank need titles."""
    if need.title:
        return need.title
    return str(need.category).replace("_", " ").replace("-", " ").title()


def _serialize_opportunity(need, *, is_invited=False):
    """Shape an EventNeed into the opportunity payload expected by the frontend."""
    return {
        "need_id": need.id,
        "event_id": need.event_id,
        "event_title": need.event.title,
        "event_start_time": need.event.start_time,
        "event_location_name": need.event.location_name,
        "need_title": _fallback_need_title(need),
        "need_description": need.description,
        "category": need.category,
        "criticality": need.criticality,
        "budget_min": need.budget_min,
        "budget_max": need.budget_max,
        "is_invited": is_invited,
    }


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
            update_series = serializer.validated_data.pop("update_series", False)
            need = serializer.save(event=event)
            
            if update_series and event.series:
                from django.db import transaction
                # Find all future/draft/published events in the same series
                other_events = Event.objects.filter(
                    series=event.series,
                    lifecycle_state__in=["draft", "published"]
                ).exclude(pk=event.pk)
                
                with transaction.atomic():
                    for other in other_events:
                        EventNeed.objects.create(
                            event=other,
                            title=need.title,
                            description=need.description,
                            category=need.category,
                            criticality=need.criticality,
                            budget_min=need.budget_min,
                            budget_max=need.budget_max,
                        )

            result = EventNeedSerializer(need)
            return success_response(
                data=result.data, message="Need created", status=201
            )
        return error_response(message="Validation Error", errors=serializer.errors)


class NeedDetailView(APIView):
    """Update or delete a specific need."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, need_id):
        """Update a need. Event host only."""
        try:
            need = EventNeed.objects.select_related("event").get(pk=need_id)
        except EventNeed.DoesNotExist:
            return error_response(message="Need not found", status=404)

        if need.event.host != request.user:
            return error_response(message="Not authorized", status=403)

        serializer = EventNeedUpdateSerializer(need, data=request.data, partial=True)
        if serializer.is_valid():
            need = serializer.save()
            result = EventNeedSerializer(need)
            return success_response(data=result.data, message="Need updated")
        return error_response(message="Validation Error", errors=serializer.errors)

    def delete(self, request, need_id):
        """Delete a need. Event host only."""
        try:
            need = EventNeed.objects.select_related("event").get(pk=need_id)
        except EventNeed.DoesNotExist:
            return error_response(message="Need not found", status=404)

        if need.event.host != request.user:
            return error_response(message="Not authorized", status=403)

        need.delete()
        return success_response(message="Need deleted")


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
        NeedInvite.objects.filter(
            need=need, vendor=request.user, status="pending"
        ).update(status="applied")

        result = NeedApplicationSerializer(application)
        return success_response(
            data=result.data, message="Application submitted", status=201
        )


class NeedApplicationReviewView(APIView):
    """Accept or reject a need application (event host only)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):  # noqa: C901
        """Update application status."""
        try:
            application = NeedApplication.objects.select_related("need__event").get(
                pk=application_id
            )
        except NeedApplication.DoesNotExist:
            return error_response(message="Application not found", status=404)

        if application.need.event.host != request.user:
            return error_response(message="Not authorized", status=403)

        new_status = request.data.get("status")
        if new_status not in ("accepted", "rejected"):
            return error_response(
                message="Status must be 'accepted' or 'rejected'", status=400
            )

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


class NeedApplicationUpdateView(APIView):
    """Update a pending need application (vendor only)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, application_id):  # noqa: C901
        """Update proposed price or message of an application."""
        try:
            application = NeedApplication.objects.get(
                pk=application_id, vendor=request.user
            )
        except NeedApplication.DoesNotExist:
            return error_response(message="Application not found", status=404)

        if application.status != "pending":
            return error_response(
                message="Can only edit pending applications", status=400
            )

        serializer = NeedApplicationCreateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        if "message" in serializer.validated_data:
            application.message = serializer.validated_data["message"]
        if "proposed_price" in serializer.validated_data:
            application.proposed_price = serializer.validated_data["proposed_price"]
        if "service_id" in serializer.validated_data:
            service_id = serializer.validated_data["service_id"]
            if service_id:
                try:
                    service = VendorService.objects.get(
                        pk=service_id, vendor=request.user
                    )
                    application.service = service
                except VendorService.DoesNotExist:
                    return error_response(message="Service not found", status=404)
            else:
                application.service = None

        application.save()
        result = NeedApplicationSerializer(application)
        return success_response(
            data=result.data, message="Application updated", status=200
        )


class MyNeedApplicationsView(APIView):
    """List need applications submitted by the authenticated vendor."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List my applications."""
        applications = NeedApplication.objects.filter(
            vendor=request.user
        ).select_related("need", "need__event")
        serializer = NeedApplicationSerializer(applications, many=True)
        return success_response(data=serializer.data)


class NeedInviteCreateView(APIView):
    """Create an invite for a vendor to apply to a need. Host only."""

    permission_classes = [IsAuthenticated]

    def post(self, request, need_id):
        """Invite a vendor for a need."""
        try:
            need = EventNeed.objects.select_related("event").get(
                pk=need_id, status="open"
            )
        except EventNeed.DoesNotExist:
            return error_response(message="Need not found or not open", status=404)

        if need.event.host != request.user:
            return error_response(message="Not authorized", status=403)

        vendor_id = request.data.get("vendor_id")
        if not vendor_id:
            return error_response(message="vendor_id is required", status=400)

        try:
            vendor_service_exists = VendorService.objects.filter(
                vendor_id=vendor_id,
                is_active=True,
            ).exists()
        except (TypeError, ValueError):
            vendor_service_exists = False
        if not vendor_service_exists:
            return error_response(message="Vendor not found", status=404)

        invite, _ = NeedInvite.objects.update_or_create(
            need=need,
            vendor_id=vendor_id,
            defaults={
                "invited_by": request.user,
                "message": request.data.get("message", ""),
                "status": "pending",
            },
        )
        serializer = NeedInviteSerializer(invite)
        return success_response(
            data=serializer.data, message="Vendor invited", status=201
        )


class MyNeedInvitesView(APIView):
    """List invitations for the current vendor."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List current user's invites."""
        invites = NeedInvite.objects.filter(vendor=request.user).select_related(
            "need__event", "invited_by"
        )
        serializer = NeedInviteSerializer(invites, many=True)
        return success_response(data=serializer.data)


class AllOpenOpportunitiesView(APIView):
    """List all open event needs for visible events without user-based filtering."""

    permission_classes = []

    def get(self, request):
        """Return every open need attached to a visible event."""
        qs = (
            EventNeed.objects.filter(
                status__in=ACTIVE_OPPORTUNITY_STATUSES,
                event__lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES,
            )
            .select_related("event")
            .order_by("event__start_time", "id")
        )

        data = [_serialize_opportunity(need) for need in qs]
        return success_response(data=data)


class MyVendorOpportunitiesView(APIView):
    """List open event needs that match current vendor service categories."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List matching opportunities."""
        categories = list(
            VendorService.objects.filter(vendor=request.user, is_active=True)
            .values_list("category", flat=True)
            .distinct()
        )
        if not categories:
            return success_response(data=[])

        base_qs = (
            EventNeed.objects.filter(
                status__in=ACTIVE_OPPORTUNITY_STATUSES,
                category__in=categories,
                event__lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES,
            )
            .exclude(applications__vendor=request.user)
            .select_related("event")
            .distinct()
        )

        invited_subquery = NeedInvite.objects.filter(
            need=OuterRef("pk"),
            vendor=request.user,
            status="pending",
        )
        needs = base_qs.annotate(is_invited=Exists(invited_subquery))

        data = [
            _serialize_opportunity(
                need,
                is_invited=bool(getattr(need, "is_invited", False)),
            )
            for need in needs
        ]
        return success_response(data=data)


class MyPotentialOpportunitiesView(APIView):
    """List open event needs in categories the vendor does NOT yet offer."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return needs outside the vendor's current service categories."""
        my_categories = list(
            VendorService.objects.filter(vendor=request.user, is_active=True)
            .values_list("category", flat=True)
            .distinct()
        )

        qs = (
            EventNeed.objects.filter(
                status__in=ACTIVE_OPPORTUNITY_STATUSES,
                event__lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES,
            )
            .exclude(category__in=my_categories)
            .exclude(applications__vendor=request.user)
            .select_related("event")
            .distinct()
        )

        data = [_serialize_opportunity(need) for need in qs]
        return success_response(data=data)
