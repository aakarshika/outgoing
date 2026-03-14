"""URL routing for event endpoints."""

from django.urls import path

from .views import (
    EventAttendeesView,
    EventAutocompleteView,
    EventCategoryListView,
    EventDetailView,
    EventFriendshipRequestCreateView,
    EventHighlightListCreateView,
    EventHighlightLikeToggleView,
    EventHighlightCommentCreateListView,
    EventInterestView,
    EventLifecycleHistoryView,
    EventLifecycleTransitionView,
    EventListCreateView,
    EventReviewCreateView,
    EventReviewDetailView,
    EventReviewLikeToggleView,
    EventReviewCommentCreateListView,
    EventTicketTierListView,
    EventViewView,
    MyEventsView,
    MyEventsView,
    MyInterestedEventsView,
    EventHostVendorMessageListCreateView,
    EventPrivateConversationGetOrCreateView,
    EventPrivateConversationListView,
    EventPrivateConversationMessageListCreateView,
    UserDirectMessageListCreateView,
)

urlpatterns = [
    path("", EventListCreateView.as_view(), name="event_list_create"),
    path("autocomplete/", EventAutocompleteView.as_view(), name="event_autocomplete"),
    path("categories/", EventCategoryListView.as_view(), name="event_categories"),
    path("my/", MyEventsView.as_view(), name="my_events"),
    path(
        "my/interested/", MyInterestedEventsView.as_view(), name="my_interested_events"
    ),
    path(
        "<int:event_id>/lifecycle/transition/",
        EventLifecycleTransitionView.as_view(),
        name="event_lifecycle_transition",
    ),
    path(
        "<int:event_id>/lifecycle/history/",
        EventLifecycleHistoryView.as_view(),
        name="event_lifecycle_history",
    ),
    path("<int:event_id>/", EventDetailView.as_view(), name="event_detail"),
    path(
        "<int:event_id>/interest/", EventInterestView.as_view(), name="event_interest"
    ),
    path(
        "<int:event_id>/attendees/",
        EventAttendeesView.as_view(),
        name="event_attendees",
    ),
    path(
        "<int:event_id>/highlights/",
        EventHighlightListCreateView.as_view(),
        name="event_highlights",
    ),
    path(
        "<int:event_id>/reviews/", EventReviewCreateView.as_view(), name="event_reviews"
    ),
    path("<int:event_id>/view/", EventViewView.as_view(), name="event_view"),
    path(
        "<int:event_id>/ticket_tiers/",
        EventTicketTierListView.as_view(),
        name="event_ticket_tiers",
    ),
    path(
        "highlights/<int:highlight_id>/like/",
        EventHighlightLikeToggleView.as_view(),
        name="highlight_like_toggle",
    ),
    path(
        "highlights/<int:highlight_id>/comments/",
        EventHighlightCommentCreateListView.as_view(),
        name="highlight_comments",
    ),
    path("reviews/<int:review_id>/", EventReviewDetailView.as_view(), name="review_detail"),
    path("reviews/<int:review_id>/like/", EventReviewLikeToggleView.as_view(), name="review_like_toggle"),
    path("reviews/<int:review_id>/comments/", EventReviewCommentCreateListView.as_view(), name="review_comments"),
    path(
        "<int:event_id>/host-vendor-messages/",
        EventHostVendorMessageListCreateView.as_view(),
        name="event_host_vendor_messages",
    ),
    path(
        "<int:event_id>/friendships/<str:target_username>/",
        EventFriendshipRequestCreateView.as_view(),
        name="event_friendship_request",
    ),
    path(
        "direct-messages/<str:target_username>/",
        UserDirectMessageListCreateView.as_view(),
        name="user_direct_messages",
    ),
    path(
        "conversations/",
        EventPrivateConversationListView.as_view(),
        name="private_conversation_list",
    ),
    path(
        "conversations/<int:conversation_id>/messages/",
        EventPrivateConversationMessageListCreateView.as_view(),
        name="private_conversation_messages",
    ),
    path(
        "<int:event_id>/get-or-create-conversation/",
        EventPrivateConversationGetOrCreateView.as_view(),
        name="private_conversation_get_or_create",
    ),
]
