from django.urls import path

from .views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    MeView,
    activate_writer,
    register,
)

urlpatterns = [
    path("auth/register/", register, name="auth-register"),
    path("auth/login/", CookieTokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/activate-writer/", activate_writer, name="users-activate-writer"),
]
