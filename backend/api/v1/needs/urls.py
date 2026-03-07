"""URL routing for needs endpoints."""

from django.urls import path

from .views import (
    EventNeedsView,
    NeedApplicationReviewView,
    NeedApplicationUpdateView,
    NeedApplyView,
    MyNeedApplicationsView,
    NeedInviteCreateView,
    MyNeedInvitesView,
    MyVendorOpportunitiesView,
    MyPotentialOpportunitiesView,
)

urlpatterns = [
    path("events/<int:event_id>/", EventNeedsView.as_view(), name="event_needs"),
    path("<int:need_id>/apply/", NeedApplyView.as_view(), name="need_apply"),
    path("<int:need_id>/invite/", NeedInviteCreateView.as_view(), name="need_invite"),
    path(
        "applications/<int:application_id>/review/",
        NeedApplicationReviewView.as_view(),
        name="application_review",
    ),
    path(
        "applications/<int:application_id>/",
        NeedApplicationUpdateView.as_view(),
        name="application_update",
    ),
    path("applications/my/", MyNeedApplicationsView.as_view(), name="my_applications"),
    path("invites/my/", MyNeedInvitesView.as_view(), name="my_invites"),
    path(
        "opportunities/my/",
        MyVendorOpportunitiesView.as_view(),
        name="my_opportunities",
    ),
    path(
        "opportunities/potential/",
        MyPotentialOpportunitiesView.as_view(),
        name="potential_opportunities",
    ),
]
