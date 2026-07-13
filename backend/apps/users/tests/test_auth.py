import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from apps.users.cookies import CSRF_COOKIE, REFRESH_COOKIE
from apps.users.models import User
from apps.users.tokens import email_verification_token

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
        "accept_terms": True,
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


def test_register_records_consent_timestamp(api_client, db):
    response = api_client.post(
        reverse("auth-register"),
        {"email": "consent@example.com", "password": "SuperSecret123!", "accept_terms": True},
        format="json",
    )
    assert response.status_code == 201
    user = User.objects.get(email="consent@example.com")
    assert user.terms_accepted_at is not None


def test_register_requires_accepting_terms(api_client, db):
    response = api_client.post(
        reverse("auth-register"),
        {"email": "noconsent@example.com", "password": "SuperSecret123!", "accept_terms": False},
        format="json",
    )
    assert response.status_code == 400
    assert not User.objects.filter(email="noconsent@example.com").exists()


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


# --- Email verification ----------------------------------------------------


def test_register_creates_unverified_user_and_sends_verification_email(api_client, db):
    response = api_client.post(
        reverse("auth-register"),
        {
            "email": "fresh@example.com",
            "password": "SuperSecret123!",
            "first_name": "Fresh",
            "last_name": "User",
            "accept_terms": True,
        },
        format="json",
    )
    assert response.status_code == 201
    assert response.json()["user"]["is_email_verified"] is False
    user = User.objects.get(email="fresh@example.com")
    assert user.is_email_verified is False
    assert len(mail.outbox) == 1
    assert "fresh@example.com" in mail.outbox[0].to


def test_email_verify_marks_address_confirmed(api_client, unverified_user):
    assert unverified_user.is_email_verified is False
    uid = urlsafe_base64_encode(force_bytes(unverified_user.pk))
    token = email_verification_token.make_token(unverified_user)
    response = api_client.post(
        reverse("auth-email-verify"), {"uid": uid, "token": token}, format="json"
    )
    assert response.status_code == 200
    unverified_user.refresh_from_db()
    assert unverified_user.is_email_verified is True


def test_email_verify_rejects_bad_token(api_client, unverified_user):
    uid = urlsafe_base64_encode(force_bytes(unverified_user.pk))
    response = api_client.post(
        reverse("auth-email-verify"), {"uid": uid, "token": "bogus"}, format="json"
    )
    assert response.status_code == 400
    unverified_user.refresh_from_db()
    assert unverified_user.is_email_verified is False


def test_email_verify_token_is_single_use(api_client, unverified_user):
    # Once the address is confirmed, the same token must stop validating.
    uid = urlsafe_base64_encode(force_bytes(unverified_user.pk))
    token = email_verification_token.make_token(unverified_user)
    api_client.post(reverse("auth-email-verify"), {"uid": uid, "token": token}, format="json")
    replay = api_client.post(
        reverse("auth-email-verify"), {"uid": uid, "token": token}, format="json"
    )
    assert replay.status_code == 400


def test_email_verify_resend_sends_email(unverified_client, unverified_user):
    response = unverified_client.post(reverse("auth-email-verify-resend"))
    assert response.status_code == 200
    assert len(mail.outbox) == 1
    assert unverified_user.email in mail.outbox[0].to


def test_email_verify_resend_noop_when_already_verified(auth_client, user):
    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])
    response = auth_client.post(reverse("auth-email-verify-resend"))
    assert response.status_code == 200
    assert len(mail.outbox) == 0


def test_email_verify_resend_requires_auth(api_client):
    response = api_client.post(reverse("auth-email-verify-resend"))
    assert response.status_code == 401


# --- Account settings: change password -------------------------------------


def test_change_password_succeeds_with_correct_current(auth_client, user):
    response = auth_client.post(
        reverse("users-change-password"),
        {"current_password": "testpass123", "new_password": "BrandNewPass123!"},
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("BrandNewPass123!")


def test_change_password_revokes_other_sessions(auth_client, user):
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import RefreshToken

    other = RefreshToken.for_user(user)  # a session on another device / an intruder
    response = auth_client.post(
        reverse("users-change-password"),
        {"current_password": "testpass123", "new_password": "BrandNewPass123!"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.json()  # the acting session is re-issued
    with pytest.raises(TokenError):
        other.check_blacklist()  # ...but the other session is now revoked


def test_password_reset_confirm_revokes_sessions(api_client, user):
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import RefreshToken

    other = RefreshToken.for_user(user)
    response = api_client.post(
        reverse("auth-password-reset-confirm"),
        {
            "uid": urlsafe_base64_encode(force_bytes(user.pk)),
            "token": default_token_generator.make_token(user),
            "password": "BrandNewPass123!",
        },
        format="json",
    )
    assert response.status_code == 200
    with pytest.raises(TokenError):
        other.check_blacklist()


def test_change_password_rejects_wrong_current(auth_client, user):
    response = auth_client.post(
        reverse("users-change-password"),
        {"current_password": "wrong", "new_password": "BrandNewPass123!"},
        format="json",
    )
    assert response.status_code == 400
    user.refresh_from_db()
    assert user.check_password("testpass123")  # unchanged


def test_change_password_rejects_weak_new(auth_client, user):
    response = auth_client.post(
        reverse("users-change-password"),
        {"current_password": "testpass123", "new_password": "123"},
        format="json",
    )
    assert response.status_code == 400


def test_change_password_requires_auth(api_client):
    response = api_client.post(reverse("users-change-password"))
    assert response.status_code == 401


# --- Account settings: change email ----------------------------------------


def test_change_email_updates_and_unverifies(auth_client, user):
    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])
    response = auth_client.post(
        reverse("users-change-email"),
        {"new_email": "moved@example.com", "current_password": "testpass123"},
        format="json",
    )
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.email == "moved@example.com"
    assert user.is_email_verified is False
    assert len(mail.outbox) == 1  # confirmation sent to the new address
    assert "moved@example.com" in mail.outbox[0].to


def test_change_email_rejects_wrong_password(auth_client, user):
    response = auth_client.post(
        reverse("users-change-email"),
        {"new_email": "moved@example.com", "current_password": "nope"},
        format="json",
    )
    assert response.status_code == 400
    user.refresh_from_db()
    assert user.email == "doctor@example.com"


def test_change_email_rejects_duplicate(auth_client, user, writer_user):
    response = auth_client.post(
        reverse("users-change-email"),
        {"new_email": writer_user.email, "current_password": "testpass123"},
        format="json",
    )
    assert response.status_code == 400


# --- Account settings: delete account --------------------------------------


def test_delete_account_anonymizes_user(auth_client, user):
    response = auth_client.delete(
        reverse("users-me"), {"current_password": "testpass123"}, format="json"
    )
    assert response.status_code == 204
    # The row is kept (transactional integrity) but scrubbed and deactivated.
    user.refresh_from_db()
    assert user.email == f"deleted-{user.pk}@kessia.invalid"
    assert user.first_name == "" and user.last_name == "" and user.bio == ""
    assert user.is_active is False
    assert user.deleted_at is not None
    assert not user.has_usable_password()


def test_delete_account_rejects_wrong_password(auth_client, user):
    response = auth_client.delete(
        reverse("users-me"), {"current_password": "nope"}, format="json"
    )
    assert response.status_code == 400
    assert User.objects.filter(pk=user.pk).exists()


def test_delete_account_requires_auth(api_client):
    response = api_client.delete(reverse("users-me"), {"current_password": "x"}, format="json")
    assert response.status_code == 401
