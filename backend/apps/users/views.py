from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.notifications import send_notification
from apps.common.throttles import (
    EmailChangeThrottle,
    EmailResendThrottle,
    LoginThrottle,
    PasswordResetThrottle,
    RegisterThrottle,
)

from .cookies import (
    REFRESH_COOKIE,
    check_csrf,
    clear_auth_cookies,
    set_auth_cookies,
)
from .models import User, WriterExperience, WriterPortfolioItem, WriterPublication
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
    WriterExperienceSerializer,
    WriterPortfolioSerializer,
    WriterPublicationSerializer,
)
from .services import anonymize_account, deletion_block_reason
from .tokens import email_verification_token


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    _send_email_verification(user)
    refresh = RefreshToken.for_user(user)
    response = Response(
        {
            "user": UserSerializer(user, context={"request": request}).data,
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
@throttle_classes([PasswordResetThrottle])
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
@throttle_classes([EmailResendThrottle])
def email_verify_resend(request):
    """Re-send the confirmation email to the current user (no-op if verified)."""
    if request.user.is_email_verified:
        return Response({"detail": "Votre adresse e-mail est déjà confirmée."})
    _send_email_verification(request.user)
    return Response({"detail": "E-mail de confirmation renvoyé."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def google_login(request):
    """Log in — or sign up — with a Google ID token from the Google button.

    The frontend's Google Identity Services button hands us a signed ID token;
    we verify it against Google's public keys (audience = our client ID), then
    match-or-create the account by email. Google accounts have no usable
    password and are email-verified by construction (Google proved ownership).
    """
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        return Response(
            {"detail": "La connexion Google n'est pas configurée."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    credential = request.data.get("credential")
    if not credential:
        return Response({"detail": "Jeton Google manquant."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        claims = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID
        )
    except ValueError:
        LoginThrottle().record_failure(request)
        return Response(
            {"detail": "Jeton Google invalide."}, status=status.HTTP_401_UNAUTHORIZED
        )
    if not claims.get("email_verified"):
        return Response(
            {"detail": "Votre adresse Google n'est pas vérifiée."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = claims["email"]
    user = User.objects.filter(email__iexact=email).first()
    created = user is None
    if created:
        # password=None -> unusable password (Google is the only way in).
        # The button states that continuing accepts the CGU, hence the consent
        # timestamp; Google already verified the address.
        user = User.objects.create_user(
            email=email,
            first_name=claims.get("given_name", ""),
            last_name=claims.get("family_name", ""),
            is_email_verified=True,
            terms_accepted_at=timezone.now(),
        )
    elif not user.is_active:
        return Response({"detail": "Compte désactivé."}, status=status.HTTP_403_FORBIDDEN)
    elif not user.is_email_verified:
        # Google just proved they own this address.
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])

    refresh = RefreshToken.for_user(user)
    response = Response(
        {"user": UserSerializer(user, context={"request": request}).data, "access": str(refresh.access_token)},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )
    set_auth_cookies(response, str(refresh))
    return response


class CookieTokenObtainPairView(TokenObtainPairView):
    """Login: return the access token in the body, the refresh in an httpOnly cookie."""

    throttle_classes = (LoginThrottle,)

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
        except (AuthenticationFailed, InvalidToken, TokenError):
            # Only failed logins count toward the anti-bruteforce throttle.
            LoginThrottle().record_failure(request)
            raise
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
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def delete(self, request):
        """Delete the account (RGPD erasure: personal data is anonymised in place,
        transactional records are kept). Password-confirmed. Refused while an
        order is in flight or funds are unsettled — finish/settle those first.
        """
        serializer = DeleteAccountSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        reason = deletion_block_reason(request.user)
        if reason:
            return Response({"detail": reason}, status=status.HTTP_409_CONFLICT)
        anonymize_account(request.user)
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
@throttle_classes([EmailChangeThrottle])
def change_email(request):
    serializer = ChangeEmailSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    # The new address is unverified — send a fresh confirmation link.
    _send_email_verification(user)
    return Response(UserSerializer(user, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activate_writer(request):
    request.user.is_writer = True
    request.user.save(update_fields=["is_writer"])
    return Response(UserSerializer(request.user, context={"request": request}).data)


class PublicWriterView(generics.RetrieveAPIView):
    """Public, shareable profile for any (non-deleted) user — writers get the
    full profile, everyone else the common fields (writer sections come back
    empty)."""

    queryset = User.objects.filter(deleted_at__isnull=True)
    serializer_class = PublicWriterSerializer
    permission_classes = (AllowAny,)


class WriterExperienceViewSet(viewsets.ModelViewSet):
    """CRUD over the current user's own career timeline."""

    serializer_class = WriterExperienceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return WriterExperience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WriterPublicationViewSet(viewsets.ModelViewSet):
    """CRUD over the current user's own publications."""

    serializer_class = WriterPublicationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return WriterPublication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WriterPortfolioViewSet(viewsets.ModelViewSet):
    """CRUD over the current user's own portfolio / réalisations."""

    serializer_class = WriterPortfolioSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return WriterPortfolioItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
