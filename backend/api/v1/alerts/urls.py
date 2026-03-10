"""URL routing for alerts endpoint."""

from django.urls import path

from .views import AlertsView, EventOverviewView

urlpatterns = [
    path("", AlertsView.as_view(), name="alerts"),
    path("event-overview/", EventOverviewView.as_view(), name="event-overview"),
]
