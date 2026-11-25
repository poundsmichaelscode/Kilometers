from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

from .throttles import (
    RegistrationThrottle,
    LoginThrottle,
    TokenRefreshThrottle,
)

from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import HealthSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    throttle_classes = [RegistrationThrottle]
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @extend_schema(
        responses={200: HealthSerializer},
        description="Check whether the KILOMETER API is responding.",
        tags=["Health"],
    )
    def get(self, request):
        return Response({
            "status": "ok",
            "service": "kilometers-api"
        })


class LoginView(TokenObtainPairView):
    throttle_classes = [LoginThrottle]


class RefreshView(TokenRefreshView):
    throttle_classes = [TokenRefreshThrottle]


class LogoutView(TokenBlacklistView):
    """Revoke only the authenticated user's refresh token."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [TokenRefreshThrottle]

    def post(self, request, *args, **kwargs):
        raw_token = request.data.get("refresh")

        if not raw_token:
            return super().post(request, *args, **kwargs)

        try:
            refresh = RefreshToken(raw_token)
        except TokenError as exc:
            raise AuthenticationFailed("Invalid refresh token.") from exc

        token_user_id = refresh.get(api_settings.USER_ID_CLAIM)
        authenticated_user_id = getattr(
            request.user,
            api_settings.USER_ID_FIELD,
        )

        if str(token_user_id) != str(authenticated_user_id):
            raise PermissionDenied(
                "You cannot revoke another user's refresh token."
            )

        return super().post(request, *args, **kwargs)
