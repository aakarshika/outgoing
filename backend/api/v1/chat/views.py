"""List conversations, list messages in a thread, and post a message."""

from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.chat.conversation_access import (
    user_may_access_event_public_thread,
    user_may_access_event_vendor_thread,
)
from apps.chat.models import ChatMessage, ChatSpecialGroupMember
from apps.chat.thread_key import (
    ParsedEventThread,
    ParsedSpecialGroupThread,
    ParsedUserThread,
    parse_thread_key,
    peer_user_id,
    user_participates_in_user_thread,
    normalize_user_thread,
)
from core.responses import error_response, success_response

from apps.chat.user_pair_activity import all_activity_for_user_pair

from .conversation_list import fetch_conversation_items
from .serializers import ChatMessageCreateSerializer, ChatMessageSerializer

User = get_user_model()


def user_may_access_thread(user, thread_key: str) -> bool:
    try:
        parsed = parse_thread_key(thread_key)
    except ValueError:
        return False

    if isinstance(parsed, ParsedUserThread):
        if not user_participates_in_user_thread(parsed, user.id):
            return False
        return thread_key == normalize_user_thread(parsed.low_id, parsed.high_id)

    if isinstance(parsed, ParsedEventThread):
        if thread_key.startswith("event_public:"):
            return user_may_access_event_public_thread(user.id, parsed.event_id)
        if thread_key.startswith("event_vendor:"):
            return user_may_access_event_vendor_thread(user.id, parsed.event_id)
        return False

    if isinstance(parsed, ParsedSpecialGroupThread):
        if thread_key != f"special_group:{parsed.group_id}":
            return False
        return ChatSpecialGroupMember.objects.filter(
            group_id=parsed.group_id, user_id=user.id
        ).exists()

    return False


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = fetch_conversation_items(request, limit=100)
        return success_response(data=items, message="Conversations retrieved")


class ThreadInsightsListView(APIView):
    """
    Phase 2 — timeline rows that are not persisted chat lines.

    Scoped to user–user threads first; event threads return an empty list.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        thread_key = request.query_params.get("thread_key")
        if not thread_key:
            return error_response(
                message="thread_key is required",
                errors={"thread_key": ["This query parameter is required."]},
            )

        if not user_may_access_thread(request.user, thread_key):
            return error_response(message="Forbidden", status=403)

        try:
            parsed = parse_thread_key(thread_key)
        except ValueError:
            return error_response(message="Invalid thread_key", status=400)

        if not isinstance(parsed, ParsedUserThread):
            return success_response(data=[], message="Thread insights retrieved")

        peer_id = (
            parsed.high_id
            if request.user.id == parsed.low_id
            else parsed.low_id
        )
        data = all_activity_for_user_pair(request.user, peer_id)
        return success_response(data=data, message="Thread insights retrieved")


class MessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        thread_key = request.query_params.get("thread_key")
        if not thread_key:
            return error_response(
                message="thread_key is required",
                errors={"thread_key": ["This query parameter is required."]},
            )

        if not user_may_access_thread(request.user, thread_key):
            return error_response(message="Forbidden", status=403)

        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = min(
                100, max(1, int(request.query_params.get("page_size", 50)))
            )
        except (TypeError, ValueError):
            page_size = 50

        qs = (
            ChatMessage.objects.filter(thread_key=thread_key)
            .select_related("sender", "sender__profile")
            .order_by("created_at", "id")
        )
        total = qs.count()
        start = (page - 1) * page_size
        slice_qs = qs[start : start + page_size]
        serializer = ChatMessageSerializer(
            slice_qs,
            many=True,
            context={"request": request},
        )
        return success_response(
            data=serializer.data,
            message="Messages retrieved",
            meta={
                "page": page,
                "page_size": page_size,
                "total_count": total,
            },
        )

    def post(self, request):
        serializer = ChatMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Validation error", errors=serializer.errors
            )

        thread_key = serializer.validated_data["thread_key"]
        body = serializer.validated_data["body"]

        if not user_may_access_thread(request.user, thread_key):
            return error_response(message="Forbidden", status=403)

        parsed = parse_thread_key(thread_key)
        user = request.user

        if isinstance(parsed, ParsedUserThread):
            canonical = normalize_user_thread(parsed.low_id, parsed.high_id)
            peer_id = peer_user_id(parsed, user.id)
            msg = ChatMessage.objects.create(
                sender=user,
                recipient_user_id=peer_id,
                body=body,
                thread_key=canonical,
            )
        elif isinstance(parsed, ParsedEventThread):
            if thread_key.startswith("event_public:"):
                msg = ChatMessage.objects.create(
                    sender=user,
                    recipient_event_public_chat_event_id=parsed.event_id,
                    body=body,
                    thread_key=f"event_public:{parsed.event_id}",
                )
            else:
                msg = ChatMessage.objects.create(
                    sender=user,
                    recipient_event_vendor_group_event_id=parsed.event_id,
                    body=body,
                    thread_key=f"event_vendor:{parsed.event_id}",
                )
        elif isinstance(parsed, ParsedSpecialGroupThread):
            msg = ChatMessage.objects.create(
                sender=user,
                recipient_special_group_id=parsed.group_id,
                body=body,
                thread_key=f"special_group:{parsed.group_id}",
            )
        else:
            return error_response(message="Invalid thread", status=400)

        out = ChatMessageSerializer(msg, context={"request": request}).data
        return success_response(data=out, message="Message created", status=201)
