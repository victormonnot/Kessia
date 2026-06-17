from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    MeView,
    PublicWriterView,
    WriterExperienceViewSet,
    WriterPortfolioViewSet,
    WriterPublicationViewSet,
    activate_writer,
    change_email,
    change_password,
    email_verify,
    email_verify_resend,
    google_login,
    password_reset_confirm,
    password_reset_request,
    register,
)

router = SimpleRouter()
router.register("users/me/experiences", WriterExperienceViewSet, basename="me-experiences")
router.register("users/me/publications", WriterPublicationViewSet, basename="me-publications")
router.register("users/me/portfolio", WriterPortfolioViewSet, basename="me-portfolio")

urlpatterns = [
    path("auth/register/", register, name="auth-register"),
    path("auth/login/", CookieTokenObtainPairView.as_view(), name="auth-login"),
    path("auth/google/", google_login, name="auth-google"),
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
    path("users/me/password/", change_password, name="users-change-password"),
    path("users/me/email/", change_email, name="users-change-email"),
    path("users/me/activate-writer/", activate_writer, name="users-activate-writer"),
    path("writers/<int:pk>/", PublicWriterView.as_view(), name="public-writer"),
    path("", include(router.urls)),
]
