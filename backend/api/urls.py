"""Main entry point for API v1 routing."""

from django.urls import include, path

urlpatterns = [
    path("auth/", include("api.v1.auth.urls")),
    path("profiles/", include("api.v1.profiles.urls")),
    path("events/", include("api.v1.events.urls")),
    path("event-series/", include("api.v1.events.urls_series")),
    path("tickets/", include("api.v1.tickets.urls")),
    path("feed/", include("api.v1.feed.urls")),
    path("vendors/", include("api.v1.vendors.urls")),
    path("needs/", include("api.v1.needs.urls")),
    path("requests/", include("api.v1.requests.urls")),
    path("alerts/", include("api.v1.alerts.urls")),
]
