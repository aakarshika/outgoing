from django.urls import path

from .views import ProfileMeView

urlpatterns = [
    path("me/", ProfileMeView.as_view(), name="profile_me"),
]
