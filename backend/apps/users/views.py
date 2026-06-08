from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.db.models import ProtectedError
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.notifications import send_notification

from .cookies import (
    REFRESH_COOKIE,
    check_csrf,
    clear_auth_cookies,
    set_auth_cookies,
)
from .models import User
from .serializers import (
    ChangeEmailSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    EmailVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PublicWriterSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from .tokens import email_verification_token


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    _send_email_verification(user)
    refresh = RefreshToken.for_user(user)
    response = Response(
        {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
        },
        status=status.HTTP_201_CREATED,
    )
    set_auth_cookies(response, str(refresh))
    return response


def _send_password_reset_email(user: User) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
    send_notification("password_reset", user.email, {"user": user, "reset_url": reset_url})


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Email a reset link if the address matches an active account.

    Always returns 200 with a generic message so the endpoint can't be used to
    enumerate which emails have an account.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = User.objects.filter(
        email__iexact=serializer.validated_data["email"], is_active=True
    ).first()
    if user:
        _send_password_reset_email(user)
    return Response(
        {
            "detail": "Si un compte existe pour cette adresse, "
            "un e-mail de réinitialisation vient d'être envoyé."
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Validate the emailed uid/token and set the new password."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Votre mot de passe a été réinitialisé."})


def _send_email_verification(user: User) -> None:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    send_notification("email_verification", user.email, {"user": user, "verify_url": verify_url})


@api_view(["POST"])
@permission_classes([AllowAny])
def email_verify(request):
    """Confirm an email address from the emailed uid/token. Idempotent."""
    serializer = EmailVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Votre adresse e-mail a été confirmée."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def email_verify_resend(request):
    """Re-send the confirmation email to the current user (no-op if verified)."""
    if request.user.is_email_verified:
        return Response({"detail": "Votre adresse e-mail est déjà confirmée."})
    _send_email_verification(request.user)
    return Response({"detail": "E-mail de confirmation renvoyé."})


class CookieTokenObtainPairView(TokenObtainPairView):
    """Login: return the access token in the body, the refresh in an httpOnly cookie."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            refresh = response.data.pop("refresh", None)
            if refresh:
                set_auth_cookies(response, refresh)
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Refresh using the httpOnly cookie (not the request body), CSRF-protected."""

    def post(self, request, *args, **kwargs):
        check_csrf(request)
        refresh = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh:
            return Response(
                {"detail": "Aucun jeton de rafraîchissement."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            response = Response(
                {"detail": "Session expirée."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            clear_auth_cookies(response)
            return response

        validated = serializer.validated_data
        response = Response({"access": validated["access"]})
        # With ROTATE_REFRESH_TOKENS a new refresh is issued; refresh the cookie.
        new_refresh = validated.get("refresh")
        if new_refresh:
            set_auth_cookies(response, new_refresh)
        return response


class LogoutView(APIView):
    """Blacklist the cookie's refresh token and clear the auth cookies."""

    permission_classes = (AllowAny,)

    def post(self, request):
        check_csrf(request)
        refresh = request.COOKIES.get(REFRESH_COOKIE)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_205_RESET_CONTENT)
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def delete(self, request):
        """Hard-delete the account (password-confirmed) and clear auth cookies."""
        serializer = DeleteAccountSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        try:
            request.user.delete()
        except ProtectedError:
            return Response(
                {"detail": "Votre compte est lié à des éléments protégés et ne peut pas être supprimé."},
                status=status.HTTP_409_CONFLICT,
            )
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"detail": "Mot de passe mis à jour."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_email(request):
    serializer = ChangeEmailSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    # The new address is unverified — send a fresh confirmation link.
    _send_email_verification(user)
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activate_writer(request):
    request.user.is_writer = True
    request.user.save(update_fields=["is_writer"])
    return Response(UserSerializer(request.user).data)


class PublicWriterView(generics.RetrieveAPIView):
    """Public, shareable writer profile. Only writers have one (404 otherwise)."""

    queryset = User.objects.filter(is_writer=True)
    serializer_class = PublicWriterSerializer
    permission_classes = (AllowAny,)
