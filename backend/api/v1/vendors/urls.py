"""URL routing for vendor endpoints."""

from django.urls import path

from .views import (
    MyServicesView,
    VendorReviewCreateView,
    VendorServiceDetailView,
    VendorServiceListCreateView,
)

urlpatterns = [
    path("", VendorServiceListCreateView.as_view(), name="vendor_services"),
    path("my/", MyServicesView.as_view(), name="my_services"),
    path(
        "<int:service_id>/",
        VendorServiceDetailView.as_view(),
        name="vendor_service_detail",
    ),
    path(
        "<int:service_id>/reviews/",
        VendorReviewCreateView.as_view(),
        name="vendor_reviews",
    ),
]
