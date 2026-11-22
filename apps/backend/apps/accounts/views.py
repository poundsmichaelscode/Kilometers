from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
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
