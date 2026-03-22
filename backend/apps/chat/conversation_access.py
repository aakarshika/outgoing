"""
Who may see which chat threads — aligned with `event_overview` participation:

- Host: `events_event.host_id`
- Vendor: `needs_needapplication.vendor_id`, `needs_needinvite.vendor_id`,
  `needs_eventneed.assigned_vendor_id` (needs on that event)
- Goer / attendee: `tickets_ticket.goer_id` (non-cancelled ticket for public chat only)
"""

from __future__ import annotations

from django.db.models import Q

from apps.events.models import Event
from apps.needs.models import EventNeed, NeedApplication, NeedInvite
from apps.tickets.models import Ticket


def _ticket_attendee_event_ids(user_id: int) -> set[int]:
    """Event IDs where the user holds an active or used ticket (not cancelled/refunded)."""
    return set(
        Ticket.objects.filter(
            goer_id=user_id,
            status__in=["active", "used"],
        ).values_list("event_id", flat=True)
    )


def _hosted_event_ids(user_id: int) -> set[int]:
    return set(Event.objects.filter(host_id=user_id).values_list("id", flat=True))


def _vendor_event_ids(user_id: int) -> set[int]:
    """
    Event IDs where the user is a vendor in the sense of event_overview:
    applied to a need, invited to a need, or assigned on a need.
    """
    assigned = EventNeed.objects.filter(assigned_vendor_id=user_id).values_list(
        "event_id", flat=True
    )
    applied = NeedApplication.objects.filter(vendor_id=user_id).values_list(
        "need__event_id", flat=True
    )
    invited = NeedInvite.objects.filter(vendor_id=user_id).values_list(
        "need__event_id", flat=True
    )
    return set(assigned) | set(applied) | set(invited)


def event_ids_for_event_public_participant(user_id: int) -> set[int]:
    """Host, goer (ticket), or vendor → may see `event_public:{event_id}` thread."""
    return (
        _hosted_event_ids(user_id)
        | _ticket_attendee_event_ids(user_id)
        | _vendor_event_ids(user_id)
    )


def event_ids_for_event_vendor_participant(user_id: int) -> set[int]:
    """Host or vendor only → may see `event_vendor:{event_id}` thread."""
    return _hosted_event_ids(user_id) | _vendor_event_ids(user_id)


def user_may_access_event_public_thread(user_id: int, event_id: int) -> bool:
    return event_id in event_ids_for_event_public_participant(user_id)


def user_may_access_event_vendor_thread(user_id: int, event_id: int) -> bool:
    return event_id in event_ids_for_event_vendor_participant(user_id)


def conversation_message_filter_q(user) -> Q:
    """
    Messages visible in the current user's inbox aggregation.

    - user–user: sender or recipient_user
    - event_public: user is host, ticket goer, or vendor for that event
    - event_vendor: user is host or vendor for that event
    - special_group: member of the group
    """
    uid = user.id
    public_ids = event_ids_for_event_public_participant(uid)
    vendor_ids = event_ids_for_event_vendor_participant(uid)

    q = Q(sender_id=uid) | Q(recipient_user_id=uid)
    q |= Q(recipient_special_group__memberships__user_id=uid)

    if public_ids:
        q |= Q(recipient_event_public_chat_event_id__in=public_ids)
    if vendor_ids:
        q |= Q(recipient_event_vendor_group_event_id__in=vendor_ids)

    return q
