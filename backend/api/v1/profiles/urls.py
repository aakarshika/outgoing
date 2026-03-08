from django.urls import path

from .views import MyActivitiesView, ProfileMeView, PublicShowcaseView

urlpatterns = [
    path("me/", ProfileMeView.as_view(), name="profile_me"),
    path("activities/", MyActivitiesView.as_view(), name="my_activities"),
    path("<str:username>/", PublicShowcaseView.as_view(), name="public_showcase"),
]
