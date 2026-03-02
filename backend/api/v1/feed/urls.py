"""URL routing for the feed endpoint."""

from django.urls import path

from .views import (
    FeedView,
    CarouselFeedView,
    RecentlyViewedFeedView,
    CompletedHighlightsFeedView,
    UpcomingFeedView,
    IconicHostsFeedView,
    TopVendorsFeedView,
)

urlpatterns = [
    path("carousel/", CarouselFeedView.as_view(), name="carousel_feed"),
    path("recently-viewed/", RecentlyViewedFeedView.as_view(), name="feed_recently_viewed"),
    path("highlights/", CompletedHighlightsFeedView.as_view(), name="feed_highlights"),
    path("upcoming/", UpcomingFeedView.as_view(), name="feed_upcoming"),
    path("iconic-hosts/", IconicHostsFeedView.as_view(), name="feed_iconic_hosts"),
    path("top-vendors/", TopVendorsFeedView.as_view(), name="feed_top_vendors"),
    path("", FeedView.as_view(), name="feed"),
]
