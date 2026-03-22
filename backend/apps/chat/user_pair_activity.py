"""
In-between timeline rows for a user–user DM, from Friendship + `event_overview`.

Aligned with `frontend/src/pages/network/user-user-activties.md`.
Rows 9–12 intentionally emit broadly (“flood”) per product choice.
"""

from __future__ import annotations

import logging
from typing import Any

from django.contrib.auth import get_user_model
from django.db import connection

from apps.events.models import Friendship

User = get_user_model()
logger = logging.getLogger(__name__)


def _dt_iso(value) -> str | None:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _friendship_activities_for_pair(viewer: User, peer: User) -> list[dict]:
    """Rows 1–2: orbit-scoped friendship rows (user1_id < user2_id in DB)."""
    low, high = sorted((viewer.id, peer.id))
    items: list[dict] = []
    qs = Friendship.objects.filter(user1_id=low, user2_id=high).select_related(
        "orbit_category", "request_sender"
    )
    peer_un = peer.username
    for f in qs:
        oc = f.orbit_category.name if f.orbit_category_id else "Orbit"

        if f.status == Friendship.STATUS_PENDING:
            occurred = f.created_at
            if f.request_sender_id == viewer.id:
                label = f"{oc} friend request sent"
            else:
                label = f"{peer_un} sent a {oc} friend request"
            items.append(
                {
                    "id": f"friendship-{f.id}-pending",
                    "type": "friend_request",
                    "occurred_at": _dt_iso(occurred),
                    "label": label,
                    "detail": None,
                    "event_id": None,
                    "event_title": None,
                }
            )
        elif f.status == Friendship.STATUS_ACCEPTED:
            occurred = f.accepted_at or f.created_at
            items.append(
                {
                    "id": f"friendship-{f.id}-accepted",
                    "type": "friends_accepted",
                    "occurred_at": _dt_iso(occurred),
                    "label": f"Became {oc} friends",
                    "detail": None,
                    "event_id": None,
                    "event_title": None,
                }
            )

    return items


def _fetch_event_overview_for_pair(viewer_id: int, peer_id: int) -> list[dict]:
    """
    All `event_overview` rows for events where viewer or peer appears in any
    mapped role (host, attendee, assigned vendor, applicant, invite vendor).
    """
    sql = """
        SELECT
            eo.event_id,
            e.title AS event_title,
            e.start_time AS event_start_time,
            e.lifecycle_state AS event_lifecycle_state,
            eo.host_user_id,
            eo.attendee_user_id,
            eo.ticket_status,
            eo.need_assigned_user_id,
            eo.need_applied_to_user_id,
            eo.need_application_requested_by_host_vendor_user_id
        FROM event_overview eo
        INNER JOIN events_event e ON e.id = eo.event_id
        WHERE (
            eo.host_user_id IN (%s, %s)
            OR (eo.attendee_user_id IS NOT NULL AND eo.attendee_user_id IN (%s, %s))
            OR (eo.need_assigned_user_id IS NOT NULL AND eo.need_assigned_user_id IN (%s, %s))
            OR (eo.need_applied_to_user_id IS NOT NULL AND eo.need_applied_to_user_id IN (%s, %s))
            OR (
                eo.need_application_requested_by_host_vendor_user_id IS NOT NULL
                AND eo.need_application_requested_by_host_vendor_user_id IN (%s, %s)
            )
        )
    """
    params = [
        viewer_id,
        peer_id,
        viewer_id,
        peer_id,
        viewer_id,
        peer_id,
        viewer_id,
        peer_id,
        viewer_id,
        peer_id,
    ]
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as exc:
        logger.warning("event_overview query failed (view missing?): %s", exc)
        return []


def _aggregate_events_from_overview(
    rows: list[dict],
) -> dict[int, dict[str, Any]]:
    """One bucket per event_id: host, attendees (non-cancelled tickets), assigned vendors."""
    by_eid: dict[int, dict[str, Any]] = {}
    for r in rows:
        eid = r["event_id"]
        if eid not in by_eid:
            by_eid[eid] = {
                "title": r["event_title"],
                "start_time": r["event_start_time"],
                "lifecycle": r["event_lifecycle_state"],
                "host_id": r["host_user_id"],
                "attendees": set(),
                "assigned_vendors": set(),
            }
        if r.get("attendee_user_id") is not None and r.get("ticket_status") != "cancelled":
            by_eid[eid]["attendees"].add(r["attendee_user_id"])
        if r.get("need_assigned_user_id") is not None:
            by_eid[eid]["assigned_vendors"].add(r["need_assigned_user_id"])
    return by_eid


def _append(
    items: list[dict],
    *,
    id_suffix: str,
    type_: str,
    occurred_at,
    label: str,
    event_id: int | None,
    event_title: str | None,
):
    items.append(
        {
            "id": id_suffix,
            "type": type_,
            "occurred_at": _dt_iso(occurred_at),
            "label": label,
            "detail": None,
            "event_id": event_id,
            "event_title": event_title,
        }
    )


def _event_overview_activities_for_pair(viewer: User, peer: User) -> list[dict]:
    """
    Rows 3–12 from user-user-activties.md using `event_overview` column semantics.
    """
    v, p = viewer.id, peer.id
    peer_un = peer.username
    raw = _fetch_event_overview_for_pair(v, p)
    by_eid = _aggregate_events_from_overview(raw)
    items: list[dict] = []

    for eid, agg in by_eid.items():
        title = agg["title"] or "Event"
        t0 = agg["start_time"]
        life = (agg["lifecycle"] or "").lower()
        host_id = agg["host_id"]
        att = agg["attendees"]
        asg = agg["assigned_vendors"]

        # 3–4: both attended (non-cancelled ticket rows in view)
        if v in att and p in att:
            if life == "completed":
                _append(
                    items,
                    id_suffix=f"co-went-{eid}",
                    type_="co_went_event",
                    occurred_at=t0,
                    label=f"Went to {title} together",
                    event_id=eid,
                    event_title=title,
                )
            elif life not in ("completed", "cancelled"):
                _append(
                    items,
                    id_suffix=f"co-going-{eid}",
                    type_="co_going_event",
                    occurred_at=t0,
                    label=f"Going to {title} together",
                    event_id=eid,
                    event_title=title,
                )

        # 5–6: host + other attended
        if host_id == v and p in att:
            _append(
                items,
                id_suffix=f"you-hosted-{eid}",
                type_="you_hosted_peer",
                occurred_at=t0,
                label=f"You hosted {peer_un}",
                event_id=eid,
                event_title=title,
            )
        if host_id == p and v in att:
            _append(
                items,
                id_suffix=f"peer-hosted-you-{eid}",
                type_="peer_hosted_you",
                occurred_at=t0,
                label=f"{peer_un} hosted you",
                event_id=eid,
                event_title=title,
            )

        # 7–8: assigned vendor + other as goer
        if v in asg and p in att:
            _append(
                items,
                id_suffix=f"you-serviced-{eid}",
                type_="you_serviced_peer",
                occurred_at=t0,
                label=f"You serviced {peer_un}",
                event_id=eid,
                event_title=title,
            )
        if p in asg and v in att:
            _append(
                items,
                id_suffix=f"peer-serviced-you-{eid}",
                type_="peer_serviced_you",
                occurred_at=t0,
                label=f"{peer_un} serviced you",
                event_id=eid,
                event_title=title,
            )

        # 9–12: flood — one row per event per pattern
        if host_id == p:
            _append(
                items,
                id_suffix=f"flood-peer-hosting-{eid}",
                type_="peer_hosting",
                occurred_at=t0,
                label=f"{peer_un} is hosting {title}",
                event_id=eid,
                event_title=title,
            )
        if host_id == v:
            _append(
                items,
                id_suffix=f"flood-you-hosting-{eid}",
                type_="you_hosting",
                occurred_at=t0,
                label=f"You are hosting {title}",
                event_id=eid,
                event_title=title,
            )
        if p in asg:
            _append(
                items,
                id_suffix=f"flood-peer-servicing-{eid}",
                type_="peer_servicing",
                occurred_at=t0,
                label=f"{peer_un} is servicing at {title}",
                event_id=eid,
                event_title=title,
            )
        if v in asg:
            _append(
                items,
                id_suffix=f"flood-you-servicing-{eid}",
                type_="you_servicing",
                occurred_at=t0,
                label=f"You are servicing at {title}",
                event_id=eid,
                event_title=title,
            )

    return items


def all_activity_for_user_pair(viewer: User, peer_id: int) -> list[dict]:
    """
    Full ordered activity list for DM insights (viewer = request.user, peer = other user).
    """
    if peer_id == viewer.id:
        return []

    peer = User.objects.filter(pk=peer_id).first()
    if not peer:
        return []

    out: list[dict] = []
    out.extend(_friendship_activities_for_pair(viewer, peer))
    out.extend(_event_overview_activities_for_pair(viewer, peer))

    out = [row for row in out if row.get("occurred_at")]
    out.sort(key=lambda r: (r["occurred_at"], r.get("id", "")))
    return out
