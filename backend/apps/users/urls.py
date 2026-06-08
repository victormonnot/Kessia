from django.urls import path

from .views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    MeView,
    PublicWriterView,
    activate_writer,
    email_verify,
    email_verify_resend,
    password_reset_confirm,
    password_reset_request,
    register,
)

urlpatterns = [
    path("auth/register/", register, name="auth-register"),
    path("auth/login/", CookieTokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", CookieTokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/password/reset/", password_reset_request, name="auth-password-reset"),
    path(
        "auth/password/reset/confirm/",
        password_reset_confirm,
        name="auth-password-reset-confirm",
    ),
    path("auth/email/verify/", email_verify, name="auth-email-verify"),
    path(
        "auth/email/verify/resend/",
        email_verify_resend,
        name="auth-email-verify-resend",
    ),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/activate-writer/", activate_writer, name="users-activate-writer"),
    path("writers/<int:pk>/", PublicWriterView.as_view(), name="public-writer"),
]
