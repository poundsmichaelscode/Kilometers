from django.urls import path

from .views import HealthView, MeView, RegisterView, LoginView, RefreshView, LogoutView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/refresh", RefreshView.as_view(), name="refresh"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("me", MeView.as_view(), name="me"),
    path("health", HealthView.as_view(), name="health"),
]
