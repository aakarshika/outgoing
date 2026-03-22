"""Greenfield chat persistence: one row per message with a namespaced thread_key."""

from django.conf import settings
from django.db import models


class ChatSpecialGroup(models.Model):
    """Ad hoc multi-person thread container (no phase-1 frontend)."""

    name = models.CharField(max_length=200, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_chat_special_groups",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_special_group"


class ChatSpecialGroupMember(models.Model):
    """Membership in a special group."""

    group = models.ForeignKey(
        ChatSpecialGroup,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_special_group_memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_special_group_member"
        constraints = [
            models.UniqueConstraint(
                fields=["group", "user"],
                name="chat_special_group_member_group_user_uniq",
            ),
        ]


class ChatMessage(models.Model):
    """A single chat line; channel is implied by which recipient FK is set."""

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_messages_sent",
    )
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_messages_received_user",
    )
    recipient_event_public_chat_event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_messages_public",
    )
    recipient_event_vendor_group_event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_messages_vendor",
    )
    recipient_special_group = models.ForeignKey(
        ChatSpecialGroup,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="messages",
    )
    body = models.TextField()
    thread_key = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_message"
        indexes = [
            models.Index(
                fields=["thread_key", "-created_at"],
                name="chat_msg_thread_created_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(
                        recipient_user_id__isnull=False,
                        recipient_event_public_chat_event_id__isnull=True,
                        recipient_event_vendor_group_event_id__isnull=True,
                        recipient_special_group_id__isnull=True,
                    )
                    | models.Q(
                        recipient_user_id__isnull=True,
                        recipient_event_public_chat_event_id__isnull=False,
                        recipient_event_vendor_group_event_id__isnull=True,
                        recipient_special_group_id__isnull=True,
                    )
                    | models.Q(
                        recipient_user_id__isnull=True,
                        recipient_event_public_chat_event_id__isnull=True,
                        recipient_event_vendor_group_event_id__isnull=False,
                        recipient_special_group_id__isnull=True,
                    )
                    | models.Q(
                        recipient_user_id__isnull=True,
                        recipient_event_public_chat_event_id__isnull=True,
                        recipient_event_vendor_group_event_id__isnull=True,
                        recipient_special_group_id__isnull=False,
                    )
                ),
                name="chat_message_single_recipient_shape",
            ),
        ]
