"""URL routing for event endpoints."""

from django.urls import path

from .views import (
    EventCategoryListView,
    EventDetailView,
    EventInterestView,
    EventListCreateView,
    MyEventsView,
    EventAttendeesView,
)

urlpatterns = [
    path("", EventListCreateView.as_view(), name="event_list_create"),
    path("categories/", EventCategoryListView.as_view(), name="event_categories"),
    path("my/", MyEventsView.as_view(), name="my_events"),
    path("<int:event_id>/", EventDetailView.as_view(), name="event_detail"),
    path("<int:event_id>/interest/", EventInterestView.as_view(), name="event_interest"),
    path("<int:event_id>/attendees/", EventAttendeesView.as_view(), name="event_attendees"),
]
