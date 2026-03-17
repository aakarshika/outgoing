import os

from django.contrib.auth import get_user_model
from rest_framework import authentication


class DevAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for development.
    Bypasses standard authentication if DEV_USER_EMAIL environment variable is set.
    """

    def authenticate(self, request):
        user_email = os.environ.get("DEV_USER_EMAIL")
        if not user_email:
            return None

        User = get_user_model()
        try:
            user = User.objects.get(email=user_email)
            return (user, None)
        except User.DoesNotExist:
            return None

    def authenticate_header(self, request):
        return "DevAuth"
