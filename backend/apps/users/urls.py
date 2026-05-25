from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import LogoutView, MeView, activate_writer, register

urlpatterns = [
    path("auth/register/", register, name="auth-register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/activate-writer/", activate_writer, name="users-activate-writer"),
]
