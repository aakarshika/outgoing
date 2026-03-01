"""URL routing for alerts endpoint."""

from django.urls import path

from .views import AlertsView

urlpatterns = [
    path("", AlertsView.as_view(), name="alerts"),
]
