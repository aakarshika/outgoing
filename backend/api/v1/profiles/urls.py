from django.urls import path

from .views import ProfileMeView, PublicShowcaseView

urlpatterns = [
    path("me/", ProfileMeView.as_view(), name="profile_me"),
    path("<str:username>/", PublicShowcaseView.as_view(), name="public_showcase"),
]
