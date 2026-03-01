"""URL routing for needs endpoints."""

from django.urls import path

from .views import EventNeedsView, NeedApplicationReviewView, NeedApplyView, MyNeedApplicationsView

urlpatterns = [
    path("events/<int:event_id>/", EventNeedsView.as_view(), name="event_needs"),
    path("<int:need_id>/apply/", NeedApplyView.as_view(), name="need_apply"),
    path(
        "applications/<int:application_id>/review/",
        NeedApplicationReviewView.as_view(),
        name="application_review",
    ),
    path("applications/my/", MyNeedApplicationsView.as_view(), name="my_applications"),
]
