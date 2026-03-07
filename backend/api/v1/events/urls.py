"""URL routing for event endpoints."""

from django.urls import path

from .views import (
    EventAutocompleteView,
    EventLifecycleHistoryView,
    EventLifecycleTransitionView,
    EventCategoryListView,
    EventDetailView,
    EventInterestView,
    EventListCreateView,
    MyEventsView,
    MyInterestedEventsView,
    EventAttendeesView,
    EventHighlightListCreateView,
    EventReviewCreateView,
    EventViewView,
)

urlpatterns = [
    path("", EventListCreateView.as_view(), name="event_list_create"),
    path("autocomplete/", EventAutocompleteView.as_view(), name="event_autocomplete"),
    path("categories/", EventCategoryListView.as_view(), name="event_categories"),
    path("my/", MyEventsView.as_view(), name="my_events"),
    path("my/interested/", MyInterestedEventsView.as_view(), name="my_interested_events"),
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
]
