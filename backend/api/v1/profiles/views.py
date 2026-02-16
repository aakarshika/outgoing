from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.profiles.services import get_or_create_profile
from core.responses import error_response, success_response
from core.serializers import SuccessResponseSerializer

from .serializers import UserProfileSerializer


class ProfileMeView(APIView):
    """View to retrieve or update the authenticated user's profile."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: SuccessResponseSerializer})
    def get(self, request):
        """Retrieve the current user's profile."""
        profile = get_or_create_profile(request.user)
        serializer = UserProfileSerializer(profile)
        return success_response(data=serializer.data)

    @extend_schema(
        request=UserProfileSerializer, responses={200: SuccessResponseSerializer}
    )
    def patch(self, request):
        """Update fields on the current user's profile."""
        profile = get_or_create_profile(request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return success_response(message="Profile updated", data=serializer.data)

        return error_response(message="Validation Error", errors=serializer.errors)

