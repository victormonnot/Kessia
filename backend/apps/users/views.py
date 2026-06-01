from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .cookies import (
    REFRESH_COOKIE,
    check_csrf,
    clear_auth_cookies,
    set_auth_cookies,
)
from .models import User
from .serializers import (
    PublicWriterSerializer,
    RegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
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
