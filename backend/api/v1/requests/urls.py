"""URL routing for event request endpoints."""

from django.urls import path

from .views import RequestListCreateView, RequestUpvoteView, RequestWishlistView

urlpatterns = [
    path("", RequestListCreateView.as_view(), name="request_list_create"),
    path(
        "<int:request_id>/upvote/",
        RequestUpvoteView.as_view(),
        name="request_upvote",
    ),
    path(
        "<int:request_id>/wishlist/",
        RequestWishlistView.as_view(),
        name="request_wishlist",
    ),
]
