"""Authentication views for v1 API."""

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from apps.profiles.services import create_user_and_profile, get_tokens_for_user
from core.responses import error_response, success_response
from core.serializers import SuccessResponseSerializer

from .serializers import LoginSerializer, SignUpSerializer, UserSerializer


class SignUpView(APIView):
    """View to handle user registration and initial profile setup."""

    permission_classes = [AllowAny]

    @extend_schema(request=SignUpSerializer, responses={200: SuccessResponseSerializer})
    def post(self, request):
        """Handle POST request for signup."""
        serializer = SignUpSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        username = serializer.validated_data["username"]
        password = serializer.validated_data.get("password")
        email = serializer.validated_data.get("email") or ""
        first_name = serializer.validated_data.get("first_name") or ""
        last_name = serializer.validated_data.get("last_name") or ""
        phone_number = serializer.validated_data.get("phone_number") or ""

        if User.objects.filter(username=username).exists():
            return error_response(
                message="Username already exists", error_code="USERNAME_TAKEN"
            )

        # Use service layer
        user, _ = create_user_and_profile(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
        )

        tokens = get_tokens_for_user(user)

        return success_response(
            message="User created successfully",
            data={
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
            },
        )


class MeView(APIView):
    """View to retrieve information about the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: SuccessResponseSerializer})
    def get(self, request):
        """Handle GET request for current user info."""
        return success_response(
            message="User info retrieved", data=UserSerializer(request.user).data
        )


class LoginView(APIView):
    """View to handle user authentication and token issuance."""

    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: SuccessResponseSerializer})
    def post(self, request):
        """Handle POST request for login."""
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(message="Validation Error", errors=serializer.errors)

        username = serializer.validated_data["username"]
        password = serializer.validated_data.get("password")

        user = authenticate(username=username, password=password)
        if not user:
            return error_response(
                message="Invalid credentials",
                error_code="INVALID_CREDENTIALS",
                status=401,
            )

        # Use service layer
        tokens = get_tokens_for_user(user)

        return success_response(
            message="Login successful",
            data={
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
            },
        )
