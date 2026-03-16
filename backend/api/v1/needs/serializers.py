"""Serializers for needs data."""

from rest_framework import serializers

from apps.needs.models import EventNeed, NeedApplication, NeedInvite


class NeedApplicationSerializer(serializers.ModelSerializer):
    """Serializer for NeedApplication."""

    vendor_name = serializers.CharField(source="vendor.username", read_only=True)
    need_title = serializers.CharField(source="need.title", read_only=True)
    event_title = serializers.CharField(source="need.event.title", read_only=True)
    event_id = serializers.IntegerField(source="need.event.id", read_only=True)
    qr_token = serializers.SerializerMethodField()

    class Meta:
        """Meta configuration for NeedApplicationSerializer."""

        model = NeedApplication
        fields = [
            "id",
            "vendor_name",
            "need_title",
            "need_id",
            "event_title",
            "event_id",
            "service",
            "message",
            "proposed_price",
            "status",
            "barcode",
            "qr_token",
            "admitted_at",
            "created_at",
        ]
        read_only_fields = ["id", "status", "barcode", "qr_token", "admitted_at", "created_at"]

    def get_qr_token(self, obj):
        """Generate a signed QR token if accepted."""
        if obj.status == "accepted" and obj.barcode and obj.qr_secret:
            import base64
            import hmac
            import hashlib
            import json
            
            payload = {
                "type": "vendor",
                "application_id": obj.id,
                "barcode": obj.barcode,
            }
            payload_json = json.dumps(payload).encode("utf-8")
            payload_b64 = base64.urlsafe_b64encode(payload_json).decode("utf-8").rstrip("=")
            
            signature = hmac.new(
                obj.qr_secret.encode("utf-8"),
                payload_b64.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            
            return f"{payload_b64}.{signature}"
        return None


class EventNeedSerializer(serializers.ModelSerializer):
    """Serializer for EventNeed."""

    applications = NeedApplicationSerializer(many=True, read_only=True)

    class Meta:
        """Meta configuration for EventNeedSerializer."""

        model = EventNeed
        fields = [
            "id",
            "title",
            "description",
            "category",
            "criticality",
            "budget_min",
            "budget_max",
            "status",
            "assigned_vendor",
            "application_count",
            "applications",
            "created_at",
        ]
        read_only_fields = ["id", "application_count", "created_at"]


class EventNeedCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating event needs."""

    class Meta:
        """Meta configuration for EventNeedCreateSerializer."""

        model = EventNeed
        fields = [
            "title",
            "description",
            "category",
            "criticality",
            "budget_min",
            "budget_max",
            "update_series",
        ]

    update_series = serializers.BooleanField(required=False, write_only=True, default=False)


class EventNeedUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating event needs."""

    class Meta:
        """Meta configuration for EventNeedUpdateSerializer."""

        model = EventNeed
        fields = [
            "title",
            "description",
            "category",
            "criticality",
            "budget_min",
            "budget_max",
            "status",
        ]


class NeedApplicationCreateSerializer(serializers.Serializer):
    """Serializer for applying to a need."""

    service_id = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField(required=False, allow_blank=True)
    proposed_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True
    )


class NeedInviteSerializer(serializers.ModelSerializer):
    """Serializer for need invitations."""

    need_title = serializers.CharField(source="need.title", read_only=True)
    event_title = serializers.CharField(source="need.event.title", read_only=True)
    event_id = serializers.IntegerField(source="need.event.id", read_only=True)
    invited_by_username = serializers.CharField(
        source="invited_by.username", read_only=True
    )

    class Meta:
        """Meta configuration for NeedInviteSerializer."""

        model = NeedInvite
        fields = [
            "id",
            "need",
            "need_title",
            "event_id",
            "event_title",
            "vendor",
            "invited_by_username",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at", "invited_by_username"]
