"""Views for DB-driven actionable alerts (not notifications)."""

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event
from apps.needs.models import NeedApplication, NeedInvite
from apps.tickets.models import Ticket
from core.responses import success_response


class AlertsView(APIView):
    """Return actionable alerts derived directly from current database state."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List alerts for host/vendor/attendee contexts."""
        user = request.user
        now = timezone.now()
        alerts = []

        # Host alerts: draft events not yet published.
        draft_events = Event.objects.filter(host=user, lifecycle_state="draft").values(
            "id", "title"
        )
        for event in draft_events:
            alerts.append(
                {
                    "id": f"host-draft-{event['id']}",
                    "type": "host_draft",
                    "title": "Draft Event Not Published",
                    "message": f"'{event['title']}' is still a draft. Publish when you're ready.",
                    "cta_label": "Open Manage Event",
                    "cta_route": f"/events/{event['id']}/manage",
                    "priority": "medium",
                }
            )

        # Host alerts: published events should move to event_ready to share attendee details.
        published_events = Event.objects.filter(
            host=user, lifecycle_state="published"
        ).values("id", "title")
        for event in published_events:
            alerts.append(
                {
                    "id": f"host-published-{event['id']}",
                    "type": "host_publish_to_ready",
                    "title": "Send Invite / Mark Event Ready",
                    "message": (
                        f"'{event['title']}' is published. Mark it as Event Ready "
                        "to share day-of details with paid attendees."
                    ),
                    "cta_label": "Mark Event Ready",
                    "cta_route": f"/events/{event['id']}/manage",
                    "priority": "high",
                }
            )

        # Host alerts: pending vendor applications grouped per event.
        host_pending_vendor = (
            NeedApplication.objects.filter(
                need__event__host=user,
                status="pending",
            )
            .values("need__event_id", "need__event__title")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        for row in host_pending_vendor:
            total = row["total"]
            alerts.append(
                {
                    "id": f"host-vendor-pending-{row['need__event_id']}",
                    "type": "host_vendor_pending",
                    "title": "Vendor Requests Pending",
                    "message": (
                        f"{total} vendor application{'s' if total != 1 else ''} "
                        f"await review for '{row['need__event__title']}'."
                    ),
                    "cta_label": "Review Applications",
                    "cta_route": f"/events/{row['need__event_id']}/manage",
                    "priority": "high",
                }
            )

        # Attendee alerts: event is ready, details now available.
        ready_tickets = (
            Ticket.objects.filter(
                goer=user,
                status="active",
                event__lifecycle_state="event_ready",
            )
            .select_related("event")
            .order_by("event__start_time")
        )
        for ticket in ready_tickets:
            alerts.append(
                {
                    "id": f"attendee-ready-{ticket.event_id}",
                    "type": "attendee_event_ready",
                    "title": "Event Details Are Ready",
                    "message": (
                        f"'{ticket.event.title}' is ready. Open event details for "
                        "location and check-in instructions."
                    ),
                    "cta_label": "View Event Details",
                    "cta_route": f"/events/{ticket.event_id}",
                    "priority": "medium",
                }
            )

        # Vendor alerts: accepted/rejected applications for active (not ended) events.
        vendor_decisions = (
            NeedApplication.objects.filter(
                vendor=user,
                status__in=["accepted", "rejected"],
            )
            .exclude(
                Q(need__event__lifecycle_state__in=["completed", "cancelled"])
                | Q(need__event__end_time__lt=now)
            )
            .values("need__event_id", "need__event__title", "status")
            .annotate(total=Count("id"))
            .order_by("status", "-total")
        )
        for row in vendor_decisions:
            decision_label = "accepted" if row["status"] == "accepted" else "rejected"
            alerts.append(
                {
                    "id": f"vendor-decision-{row['status']}-{row['need__event_id']}",
                    "type": "vendor_application_decision",
                    "title": f"Application {decision_label.title()}",
                    "message": (
                        f"{row['total']} application{'s were' if row['total'] != 1 else ' was'} "
                        f"{decision_label} for '{row['need__event__title']}'."
                    ),
                    "cta_label": "View Event",
                    "cta_route": f"/events/{row['need__event_id']}",
                    "priority": "medium" if row["status"] == "accepted" else "low",
                }
            )

        # Vendor alerts: direct host invites to apply for open needs.
        pending_invites = (
            NeedInvite.objects.filter(vendor=user, status="pending")
            .exclude(
                Q(need__event__lifecycle_state__in=["completed", "cancelled"])
                | Q(need__event__end_time__lt=now)
            )
            .select_related("need__event", "invited_by")
        )
        for invite in pending_invites:
            alerts.append(
                {
                    "id": f"vendor-invite-{invite.id}",
                    "type": "vendor_need_invite",
                    "title": "Possible Event Match",
                    "message": (
                        f"{invite.invited_by.username} invited you to apply for "
                        f"'{invite.need.title}' at '{invite.need.event.title}'."
                    ),
                    "cta_label": "View Opportunities",
                    "cta_route": "/vendor-opportunities",
                    "priority": "high",
                }
            )

        return success_response(data=alerts)
