import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from apps.users.cookies import CSRF_COOKIE, REFRESH_COOKIE
from apps.users.models import User

pytestmark = pytest.mark.django_db


def _csrf_headers(client):
    """Echo the CSRF cookie the server set as the double-submit header."""
    return {"HTTP_X_CSRFTOKEN": client.cookies[CSRF_COOKIE].value}


def test_register_sets_refresh_cookie_and_returns_access(api_client):
    payload = {
        "email": "new@example.com",
        "password": "SuperSecret123!",
        "first_name": "New",
        "last_name": "User",
    }
    response = api_client.post(reverse("auth-register"), payload, format="json")
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["access"]
    assert "refresh" not in body  # refresh now lives in the httpOnly cookie
    assert response.cookies[REFRESH_COOKIE]["httponly"]
    assert CSRF_COOKIE in response.cookies
    assert User.objects.filter(email="new@example.com").exists()


def test_login_sets_cookie_and_returns_access(api_client, user):
    response = api_client.post(
        reverse("auth-login"),
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access"]
    assert "refresh" not in body
    assert response.cookies[REFRESH_COOKIE]["httponly"]


def test_refresh_from_cookie_with_csrf(api_client, user):
    api_client.post(
        reverse("auth-login"),
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    # Login stored the refresh + csrf cookies on the test client.
    response = api_client.post(reverse("auth-refresh"), **_csrf_headers(api_client))
    assert response.status_code == 200
    assert response.json()["access"]


def test_refresh_requires_csrf_header(api_client, user):
    api_client.post(
        reverse("auth-login"),
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    response = api_client.post(reverse("auth-refresh"))  # missing X-CSRFToken
    assert response.status_code == 403


def test_refresh_without_cookie_is_unauthorized(api_client):
    # Forge a matching csrf pair to pass the CSRF gate, but provide no refresh.
    api_client.cookies[CSRF_COOKIE] = "tok"
    response = api_client.post(reverse("auth-refresh"), HTTP_X_CSRFTOKEN="tok")
    assert response.status_code == 401


def test_logout_blacklists_and_clears_cookie(api_client, user):
    api_client.post(
        reverse("auth-login"),
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    refresh_value = api_client.cookies[REFRESH_COOKIE].value

    logout = api_client.post(reverse("auth-logout"), **_csrf_headers(api_client))
    assert logout.status_code == 205
    assert api_client.cookies[REFRESH_COOKIE].value == ""  # cookie cleared

    # The blacklisted token can't be refreshed even if re-presented directly.
    fresh = APIClient()
    fresh.cookies[REFRESH_COOKIE] = refresh_value
    fresh.cookies[CSRF_COOKIE] = "tok"
    reused = fresh.post(reverse("auth-refresh"), HTTP_X_CSRFTOKEN="tok")
    assert reused.status_code == 401


def test_me_get_returns_current_user(auth_client, user):
    response = auth_client.get(reverse("users-me"))
    assert response.status_code == 200
    assert response.json()["email"] == user.email


def test_me_patch_updates_profile(auth_client, user):
    response = auth_client.patch(
        reverse("users-me"),
        {"first_name": "Newname", "bio": "About me"},
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.first_name == "Newname"
    assert user.bio == "About me"


def test_activate_writer_flips_flag(auth_client, user):
    assert user.is_writer is False
    response = auth_client.post(reverse("users-activate-writer"))
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.is_writer is True


# --- Password reset --------------------------------------------------------


def test_password_reset_request_sends_email_for_existing_user(api_client, user):
    response = api_client.post(
        reverse("auth-password-reset"), {"email": user.email}, format="json"
    )
    assert response.status_code == 200
    assert len(mail.outbox) == 1
    assert user.email in mail.outbox[0].to


def test_password_reset_request_unknown_email_is_silent(api_client, db):
    # Same 200 + generic message as a hit, and no email: no account enumeration.
    response = api_client.post(
        reverse("auth-password-reset"), {"email": "nobody@example.com"}, format="json"
    )
    assert response.status_code == 200
    assert len(mail.outbox) == 0


def test_password_reset_confirm_sets_new_password(api_client, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    response = api_client.post(
        reverse("auth-password-reset-confirm"),
        {"uid": uid, "token": token, "password": "BrandNewPass123!"},
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("BrandNewPass123!")


def test_password_reset_confirm_rejects_bad_token(api_client, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    response = api_client.post(
        reverse("auth-password-reset-confirm"),
        {"uid": uid, "token": "bogus-token", "password": "BrandNewPass123!"},
        format="json",
    )
    assert response.status_code == 400
    user.refresh_from_db()
    assert not user.check_password("BrandNewPass123!")


def test_password_reset_confirm_rejects_weak_password(api_client, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    response = api_client.post(
        reverse("auth-password-reset-confirm"),
        {"uid": uid, "token": token, "password": "123"},
        format="json",
    )
    assert response.status_code == 400
