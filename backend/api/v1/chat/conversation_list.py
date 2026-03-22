"""Build the authenticated user's conversation list for GET /chat/conversations/."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Max

from apps.chat.conversation_access import conversation_message_filter_q
from apps.chat.models import ChatMessage
from apps.chat.thread_key import (
    ParsedEventThread,
    ParsedUserThread,
    parse_thread_key,
)
from apps.events.models import Event
from core.utils import resolve_media_url

from .serializers import ChatMessageSerializer, ConversationItemSerializer

User = get_user_model()


def _user_mini(user_obj, request):
    if not user_obj:
        return None
    profile = getattr(user_obj, "profile", None)
    avatar = (
        resolve_media_url(profile.avatar, request)
        if profile and profile.avatar
        else None
    )
    return {
        "id": user_obj.id,
        "username": user_obj.username,
        "first_name": user_obj.first_name,
        "last_name": user_obj.last_name,
        "avatar": avatar,
    }


def _event_mini(event):
    if not event:
        return None
    return {"id": event.id, "title": event.title}


def fetch_conversation_items(request, limit: int = 100) -> list[dict]:
    """
    Distinct thread_keys the user may see (per `conversation_message_filter_q`),
    ordered by latest message time, with peer/event enrichment.
    """
    user = request.user
    aggregates = (
        ChatMessage.objects.filter(conversation_message_filter_q(user))
        .values("thread_key")
        .annotate(last_at=Max("created_at"))
        .order_by("-last_at")[:limit]
    )

    items: list[dict] = []
    for row in aggregates:
        tk = row["thread_key"]
        last = (
            ChatMessage.objects.filter(thread_key=tk)
            .select_related("sender", "sender__profile")
            .order_by("-created_at")
            .first()
        )
        entry = {
            "thread_key": tk,
            "updated_at": row["last_at"],
            "last_message": (
                ChatMessageSerializer(last, context={"request": request}).data
                if last
                else None
            ),
            "peer_user": None,
            "event": None,
        }
        try:
            parsed = parse_thread_key(tk)
        except ValueError:
            items.append(entry)
            continue

        if isinstance(parsed, ParsedUserThread):
            if user.id == parsed.low_id:
                peer_id = parsed.high_id
            elif user.id == parsed.high_id:
                peer_id = parsed.low_id
            else:
                peer_id = None
            if peer_id:
                peer = User.objects.filter(pk=peer_id).select_related("profile").first()
                entry["peer_user"] = _user_mini(peer, request)

        elif isinstance(parsed, ParsedEventThread):
            ev = Event.objects.filter(pk=parsed.event_id).first()
            entry["event"] = _event_mini(ev)

        items.append(entry)

    return [ConversationItemSerializer(instance=e).data for e in items]
