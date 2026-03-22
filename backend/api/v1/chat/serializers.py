"""Serializers for chat list and message APIs."""

from rest_framework import serializers

from apps.chat.models import ChatMessage
from core.utils import resolve_media_url


class ChatMessageSerializer(serializers.ModelSerializer):
    """Outbound message row."""

    sender_username = serializers.CharField(source="sender.username", read_only=True)
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = (
            "id",
            "sender_id",
            "sender_username",
            "sender_avatar",
            "thread_key",
            "body",
            "created_at",
        )
        read_only_fields = fields

    def get_sender_avatar(self, obj):
        profile = getattr(obj.sender, "profile", None)
        if not profile or not profile.avatar:
            return None
        request = self.context.get("request")
        return resolve_media_url(profile.avatar, request)


class ChatMessageCreateSerializer(serializers.Serializer):
    """Create a message in a thread (recipient shape derived server-side)."""

    thread_key = serializers.CharField(max_length=256)
    body = serializers.CharField(allow_blank=False)


class ConversationItemSerializer(serializers.Serializer):
    """
    One inbox row: thread key, last activity time, optional last message,
    and enrichment (DM peer or event summary).
    """

    thread_key = serializers.CharField()
    updated_at = serializers.DateTimeField()
    last_message = serializers.DictField(allow_null=True, required=False)
    peer_user = serializers.DictField(allow_null=True, required=False)
    event = serializers.DictField(allow_null=True, required=False)
