from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventReview
from apps.profiles.services import get_or_create_profile
from apps.tickets.models import Ticket
from apps.vendors.models import VendorReview, VendorService
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

        # Hosted Events
        hosted_events = [
            {
                "id": e.id,
                "title": e.title,
                "slug": e.slug,
                "start_time": e.start_time,
                "location_name": e.location_name,
                "cover_image": request.build_absolute_uri(e.cover_image.url)
                if e.cover_image
                else None,
            }
            for e in user.hosted_events.filter(
                lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
            ).order_by("-start_time")[:10]
        ]

        # Attended Events
        tickets = (
            Ticket.objects.select_related("event")
            .filter(
                goer=user,
                status__in=["active", "used"],
                event__lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES,
            )
            .order_by("-event__start_time")[:10]
        )

        attended_events = [
            {
                "id": t.event.id,
                "title": t.event.title,
                "slug": t.event.slug,
                "start_time": t.event.start_time,
                "location_name": t.event.location_name,
                "cover_image": request.build_absolute_uri(t.event.cover_image.url)
                if t.event.cover_image
                else None,
            }
            for t in tickets
        ]

        # Vendor Services
        active_services = VendorService.objects.filter(
            vendor=user, is_active=True
        ).order_by("-created_at")
        services = [
            {
                "id": s.id,
                "title": s.title,
                "category": s.category,
                "base_price": str(s.base_price) if s.base_price else None,
                "portfolio_image": request.build_absolute_uri(s.portfolio_image.url)
                if s.portfolio_image
                else None,
            }
            for s in active_services[:5]
        ]

        # Badges
        badges = []
        hosted_count = user.hosted_events.filter(
            lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
        ).count()
        if hosted_count >= 3:
            badges.append(
                {
                    "id": "host_pro",
                    "label": "Host Extraordinaire",
                    "icon": "star",
                    "color": "#fef08a",
                }
            )
        elif hosted_count > 0:
            badges.append(
                {
                    "id": "host",
                    "label": "Event Host",
                    "icon": "award",
                    "color": "#e2e8f0",
                }
            )

        if active_services.exists():
            badges.append(
                {
                    "id": "vendor",
                    "label": "Trusted Vendor",
                    "icon": "briefcase",
                    "color": "#fdba74",
                }
            )

        attended_count = Ticket.objects.filter(
            goer=user,
            status__in=["active", "used"],
            event__lifecycle_state__in=["live", "completed"],
        ).count()
        if attended_count >= 5:
            badges.append(
                {
                    "id": "social",
                    "label": "Social Butterfly",
                    "icon": "users",
                    "color": "#a7f3d0",
                }
            )

        if hosted_count == 0 and attended_count > 0:
            badges.append(
                {
                    "id": "enthusiast",
                    "label": "Enthusiast",
                    "icon": "heart",
                    "color": "#fecaca",
                }
            )

        # Testimonials
        event_reviews = (
            EventReview.objects.select_related("reviewer", "reviewer__profile", "event")
            .filter(event__host=user, is_public=True)
            .order_by("-created_at")[:5]
        )

        vendor_reviews = (
            VendorReview.objects.select_related(
                "reviewer", "reviewer__profile", "vendor_service"
            )
            .filter(vendor_service__vendor=user, is_public=True)
            .order_by("-created_at")[:5]
        )

        testimonials = []
        for r in event_reviews:
            r_profile = getattr(r.reviewer, "profile", None)
            avatar_url = (
                request.build_absolute_uri(r_profile.avatar.url)
                if r_profile and r_profile.avatar
                else None
            )
            testimonials.append(
                {
                    "id": f"event_{r.id}",
                    "type": "event",
                    "text": r.text,
                    "rating": r.rating,
                    "reviewer_name": r.reviewer.username,
                    "reviewer_avatar": avatar_url,
                    "context": r.event.title,
                    "date": r.created_at,
                }
            )

        for r in vendor_reviews:
            r_profile = getattr(r.reviewer, "profile", None)
            avatar_url = (
                request.build_absolute_uri(r_profile.avatar.url)
                if r_profile and r_profile.avatar
                else None
            )
            testimonials.append(
                {
                    "id": f"vendor_{r.id}",
                    "type": "vendor",
                    "text": r.text,
                    "rating": r.rating,
                    "reviewer_name": r.reviewer.username,
                    "reviewer_avatar": avatar_url,
                    "context": r.vendor_service.title,
                    "date": r.created_at,
                }
            )

        testimonials.sort(key=lambda x: x["date"], reverse=True)
        testimonials = testimonials[:8]

        data = {
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "headline": profile.headline,
            "showcase_bio": profile.showcase_bio,
            "avatar": request.build_absolute_uri(profile.avatar.url)
            if profile.avatar
            else None,
            "cover_photo": request.build_absolute_uri(profile.cover_photo.url)
            if profile.cover_photo
            else None,
            "location_city": profile.location_city,
            "hosted_events": hosted_events,
            "attended_events": attended_events,
            "services": services,
            "badges": badges,
            "testimonials": testimonials,
        }

        return success_response(data=data)
