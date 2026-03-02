from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event
from apps.profiles.services import get_or_create_profile
from core.responses import error_response, success_response
from core.serializers import SuccessResponseSerializer

from .serializers import UserProfileSerializer


class ProfileMeView(APIView):
    """View to retrieve or update the authenticated user's profile."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(responses={200: SuccessResponseSerializer})
    def get(self, request):
        """Retrieve the current user's profile."""
        profile = get_or_create_profile(request.user)
        serializer = UserProfileSerializer(profile, context={"request": request})
        return success_response(data=serializer.data)

    @extend_schema(
        request=UserProfileSerializer, responses={200: SuccessResponseSerializer}
    )
    def patch(self, request):
        """Update fields on the current user's profile."""
        profile = get_or_create_profile(request.user)
        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return success_response(message="Profile updated", data=serializer.data)

        return error_response(message="Validation Error", errors=serializer.errors)


class PublicShowcaseView(APIView):
    """Public profile/showcase page for any user by username."""

    permission_classes = [AllowAny]

    def get(self, request, username):
        """Get public showcase data for a user."""
        try:
            user = User.objects.select_related("profile").get(username=username)
        except User.DoesNotExist:
            return error_response(message="User not found", status=404)

        profile = get_or_create_profile(user)

        data = {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "headline": profile.headline,
            "showcase_bio": profile.showcase_bio,
            "avatar": request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
            "cover_photo": request.build_absolute_uri(profile.cover_photo.url) if profile.cover_photo else None,
            "location_city": profile.location_city,
            "hosted_events": list(
                user.hosted_events.filter(
                    lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
                ).values(
                    "id", "title", "slug", "start_time", "location_name"
                )[:10]
            ),
        }

        return success_response(data=data)

