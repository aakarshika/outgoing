"""URL routing for the feed endpoint."""

from django.urls import path

from .views import FeedView

urlpatterns = [
    path("", FeedView.as_view(), name="feed"),
]
