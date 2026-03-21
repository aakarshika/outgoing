from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import Event, EventReview, Friendship
from apps.profiles.services import get_or_create_profile
from apps.profiles.user_tags import get_user_tags
from apps.tickets.models import Ticket
from apps.vendors.models import VendorReview, VendorService
from core.responses import error_response, success_response
from core.serializers import SuccessResponseSerializer
from core.utils import resolve_media_url

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

    @staticmethod
    def _serialize_shared_events(viewer, target_user, request):
        viewer_event_ids = set(
            Ticket.objects.filter(goer=viewer, status="used")
            .values_list("event_id", flat=True)
            .distinct()
        )
        if not viewer_event_ids:
            return []

        target_tickets = (
            Ticket.objects.select_related("event")
            .filter(
                goer=target_user,
                status="used",
                event_id__in=viewer_event_ids,
            )
            .order_by("-event__start_time", "-event_id")
        )

        seen_event_ids = set()
        shared_events = []
        for ticket in target_tickets:
            if ticket.event_id in seen_event_ids or not ticket.event:
                continue
            seen_event_ids.add(ticket.event_id)
            shared_events.append(
                {
                    "id": ticket.event.id,
                    "title": ticket.event.title,
                    "start_time": ticket.event.start_time,
                    "location_name": ticket.event.location_name,
                    "cover_image": (
                        resolve_media_url(ticket.event.cover_image, request)
                        if ticket.event.cover_image
                        else None
                    ),
                }
            )

        return shared_events

    def get(self, request, username):
        """Get public showcase data for a user."""
        try:
            user = User.objects.select_related("profile").get(username=username)
        except User.DoesNotExist:
            return error_response(message="User not found", status=404)

        profile = get_or_create_profile(user)

        is_authenticated_viewer = request.user.is_authenticated
        is_self_profile = is_authenticated_viewer and request.user.id == user.id

        shared_events = []
        friendship = None

        if is_authenticated_viewer and not is_self_profile:
            shared_events = self._serialize_shared_events(request.user, user, request)

            user1_id, user2_id = sorted([request.user.id, user.id])
            friendship = Friendship.objects.select_related(
                "met_at_event",
                "met_at_event__category",
            ).filter(
                user1_id=user1_id,
                user2_id=user2_id,
            ).first()

        has_shared_events = bool(shared_events)

        incoming_request = bool(
            friendship
            and friendship.status == Friendship.STATUS_PENDING
            and friendship.request_sender_id != request.user.id
            if is_authenticated_viewer and friendship
            else False
        )
        outgoing_request = bool(
            friendship
            and friendship.status == Friendship.STATUS_PENDING
            and friendship.request_sender_id == request.user.id
            if is_authenticated_viewer and friendship
            else False
        )

        can_view_full_profile = is_self_profile or (
            is_authenticated_viewer and has_shared_events
        )

        if not is_authenticated_viewer:
            cta = "login_required"
        elif is_self_profile:
            cta = "none"
        elif not has_shared_events:
            cta = "no_shared_events"
        elif incoming_request:
            cta = "accept_invitation"
        elif outgoing_request:
            cta = "request_sent"
        elif friendship and friendship.status == Friendship.STATUS_ACCEPTED:
            cta = "none"
        else:
            cta = "add_friend"

        access = {
            "is_authenticated_viewer": is_authenticated_viewer,
            "is_self_profile": is_self_profile,
            "has_shared_events": has_shared_events,
            "shared_events": shared_events,
            "latest_shared_event_id": shared_events[0]["id"] if shared_events else None,
            "friendship_status": friendship.status if friendship else "none",
            "incoming_request": incoming_request,
            "outgoing_request": outgoing_request,
            "incoming_request_event_id": (
                friendship.met_at_event_id if friendship and incoming_request else None
            ),
            "met_at_event_title": (
                friendship.met_at_event.title if friendship and friendship.met_at_event else None
            ),
            "orbit_category_slug": (
                friendship.orbit_category.slug
                if friendship and friendship.orbit_category_id
                else None
            ),
            "can_view_full_profile": can_view_full_profile,
            "cta": cta,
        }

        base_data = {
            "username": user.username,
            "first_name": user.first_name if profile.privacy_name else "",
            "last_name": user.last_name if profile.privacy_name else "",
            "date_joined": user.date_joined,
            "avatar": resolve_media_url(profile.avatar, request),
            "access": access,
        }

        if not can_view_full_profile:
            return success_response(data=base_data)

        # Hosted Events
        if profile.privacy_events_attending or profile.privacy_events_attended:
            tickets_query = Ticket.objects.select_related("event").filter(
                goer=user,
                status__in=["active", "used"],
                event__lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES,
            )
            
            if not profile.privacy_events_attending:
                tickets_query = tickets_query.filter(event__lifecycle_state="completed") # Only show past if attending is hidden
            if not profile.privacy_events_attended:
                tickets_query = tickets_query.exclude(event__lifecycle_state="completed")
                
            tickets = tickets_query.order_by("-event__start_time")[:10]

            attended_events = [
                {
                    "id": t.event.id,
                    "title": t.event.title,
                    "slug": t.event.slug,
                    "start_time": t.event.start_time,
                    "location_name": t.event.location_name,
                    "cover_image": resolve_media_url(t.event.cover_image, request)
                    if t.event.cover_image
                    else None,
                }
                for t in tickets
            ]
        else:
            attended_events = []

        # Hosted Events
        if profile.privacy_hosted_events:
            hosted_events = [
                {
                    "id": e.id,
                    "title": e.title,
                    "slug": e.slug,
                    "start_time": e.start_time,
                    "location_name": e.location_name,
                    "cover_image": resolve_media_url(e.cover_image, request)
                    if e.cover_image
                    else None,
                }
                for e in user.hosted_events.filter(
                    lifecycle_state__in=Event.VISIBLE_LIFECYCLE_STATES
                ).order_by("-start_time")[:10]
            ]
        else:
            hosted_events = []

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
                "portfolio_image": resolve_media_url(s.portfolio_image, request)
                if s.portfolio_image
                else None,
            }
            for s in active_services[:5]
        ]

        # User category tags (computed from activity)
        user_tags = get_user_tags(user)

        # Backward-compatible badges list — only tags the user has actually earned
        badges = [
            {
                "id": t["id"],
                "label": f'{t["emoji"]} {t["label"]}',
                "icon": t["icon"],
                "color": t["color"],
                "is_earned": True,
                "description": t.get("description", ""),
            }
            for t in user_tags["all_tags"]
            if t.get("is_earned", False)
        ]

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
            **base_data,
            "email": user.email if profile.privacy_email else "",
            "headline": profile.headline,
            "showcase_bio": profile.showcase_bio,
            "cover_photo": resolve_media_url(profile.cover_photo, request),
            "location_city": profile.location_city,
            "hosted_events": hosted_events,
            "attended_events": attended_events,
            "hosted_count": user.hosted_events.filter(lifecycle_state='completed').count(),
            "attended_count": Ticket.objects.filter(goer=user, status__in=['active', 'used']).count(),
            "total_goers": sum(e.ticket_count or 0 for e in user.hosted_events.all()),
            "total_reviews": len(testimonials),
            "services": services,
            "badges": badges,
            "user_tags": user_tags,
            "testimonials": testimonials,
        }

        return success_response(data=data)

class MyActivitiesView(APIView):
    """View to fetch all reviews and comments authored by the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Consolidate user's reviews and comments across the platform."""
        user = request.user

        # 1. Event Reviews
        event_reviews = (
            EventReview.objects.select_related("event")
            .filter(reviewer=user)
            .order_by("-created_at")
        )
        event_reviews_data = [
            {
                "id": r.id,
                "type": "event_review",
                "title": r.event.title,
                "event_id": r.event.id,
                "rating": r.rating,
                "text": r.text,
                "created_at": r.created_at,
            }
            for r in event_reviews
        ]

        # 2. Vendor Reviews
        vendor_reviews = (
            VendorReview.objects.select_related("vendor_service", "event")
            .filter(reviewer=user)
            .order_by("-created_at")
        )
        vendor_reviews_data = [
            {
                "id": r.id,
                "type": "vendor_review",
                "title": r.vendor_service.title,
                "service_id": r.vendor_service.id,
                "event_title": r.event.title if r.event else None,
                "rating": r.rating,
                "text": r.text,
                "created_at": r.created_at,
            }
            for r in vendor_reviews
        ]

        # 3. Review Comments
        from apps.events.models import EventReviewComment
        review_comments = (
            EventReviewComment.objects.select_related("review", "review__event")
            .filter(author=user)
            .order_by("-created_at")
        )
        review_comments_data = [
            {
                "id": c.id,
                "type": "review_comment",
                "text": c.text,
                "target_title": c.review.event.title,
                "target_id": c.review.id,
                "created_at": c.created_at,
            }
            for c in review_comments
        ]

        # 4. Highlight Comments
        from apps.events.models import EventHighlightComment
        highlight_comments = (
            EventHighlightComment.objects.select_related("highlight", "highlight__event")
            .filter(author=user)
            .order_by("-created_at")
        )
        highlight_comments_data = [
            {
                "id": c.id,
                "type": "highlight_comment",
                "text": c.text,
                "target_title": c.highlight.event.title,
                "target_id": c.highlight.id,
                "created_at": c.created_at,
            }
            for c in highlight_comments
        ]

        activities = {
            "reviews": event_reviews_data + vendor_reviews_data,
            "comments": review_comments_data + highlight_comments_data,
        }

        # Sort combined lists by created_at
        activities["reviews"].sort(key=lambda x: x["created_at"], reverse=True)
        activities["comments"].sort(key=lambda x: x["created_at"], reverse=True)

        return success_response(data=activities)
