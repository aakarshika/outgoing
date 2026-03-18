"""URL routing for the feed endpoint."""

from django.urls import path

from .views import (
    BaseFeedView,
    CarouselFeedView,
    CompletedHighlightsFeedView,
    FeedView,
    IconicHostsFeedView,
    RecentlyViewedFeedView,
    TopVendorsFeedView,
    TrendingHighlightsFeedView,
    UpcomingFeedView,
)

urlpatterns = [
    path("base/", BaseFeedView.as_view(), name="base_feed"),
    path("carousel/", CarouselFeedView.as_view(), name="carousel_feed"),
    path(
        "trending-highlights/",
        TrendingHighlightsFeedView.as_view(),
        name="feed_trending_highlights",
    ),
    path(
        "recently-viewed/",
        RecentlyViewedFeedView.as_view(),
        name="feed_recently_viewed",
    ),
    path("highlights/", CompletedHighlightsFeedView.as_view(), name="feed_highlights"),
    path("upcoming/", UpcomingFeedView.as_view(), name="feed_upcoming"),
    path("iconic-hosts/", IconicHostsFeedView.as_view(), name="feed_iconic_hosts"),
    path("top-vendors/", TopVendorsFeedView.as_view(), name="feed_top_vendors"),
    path("", FeedView.as_view(), name="feed"),
]
