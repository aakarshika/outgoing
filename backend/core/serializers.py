"""Base serializers for API response envelopes."""

from rest_framework import serializers


class SuccessResponseSerializer(serializers.Serializer):
    """Base serializer for success responses."""

    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Success")
    data = serializers.DictField(default={})
    meta = serializers.DictField(default={})


class ErrorResponseSerializer(serializers.Serializer):
    """Base serializer for error responses."""

    success = serializers.BooleanField(default=False)
    message = serializers.CharField(default="Error")
    errors = serializers.DictField(default={})
    error_code = serializers.CharField(default="ERROR")
