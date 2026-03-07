"""URL routing for event series endpoints."""

from django.urls import path

from .views_series import (
    EventSeriesDetailView,
    EventSeriesGenerateView,
    EventSeriesListCreateView,
    EventSeriesOccurrencesView,
)

urlpatterns = [
    path("", EventSeriesListCreateView.as_view(), name="event_series_list_create"),
    path(
        "<int:series_id>/", EventSeriesDetailView.as_view(), name="event_series_detail"
    ),
    path(
        "<int:series_id>/occurrences/",
        EventSeriesOccurrencesView.as_view(),
        name="event_series_occurrences",
    ),
    path(
        "<int:series_id>/generate-occurrences/",
        EventSeriesGenerateView.as_view(),
        name="event_series_generate",
    ),
]
