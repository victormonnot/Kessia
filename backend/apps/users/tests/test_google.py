"""Google sign-in: the endpoint verifies a Google ID token and matches or
creates the account by email. Google's verifier is mocked — these tests cover
our logic, not Google's."""

from unittest.mock import patch

import pytest
from django.urls import reverse

from apps.users.cookies import REFRESH_COOKIE
from apps.users.models import User

pytestmark = pytest.mark.django_db

VERIFY = "apps.users.views.google_id_token.verify_oauth2_token"

CLAIMS = {
    "email": "gmail.user@gmail.com",
    "email_verified": True,
    "given_name": "Gma",
    "family_name": "Il",
    "sub": "google-uid-123",
}


@pytest.fixture(autouse=True)
def _google_configured(settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = "test-client-id.apps.googleusercontent.com"


def _post(client):
    return client.post(reverse("auth-google"), {"credential": "fake-token"}, format="json")


def test_google_login_creates_verified_passwordless_user(api_client):
    with patch(VERIFY, return_value=CLAIMS):
        response = _post(api_client)
    assert response.status_code == 201
    body = response.json()
    assert body["access"]
    assert body["user"]["email"] == CLAIMS["email"]
    assert response.cookies[REFRESH_COOKIE]["httponly"]

    user = User.objects.get(email=CLAIMS["email"])
    assert user.is_email_verified is True  # Google proved ownership
    assert not user.has_usable_password()  # no password login for this account
    assert user.terms_accepted_at is not None
    assert user.first_name == "Gma"


def test_google_login_matches_existing_account_by_email(api_client, user):
    claims = {**CLAIMS, "email": user.email.upper()}  # case-insensitive match
    with patch(VERIFY, return_value=claims):
        response = _post(api_client)
    assert response.status_code == 200
    assert response.json()["user"]["id"] == user.id
    assert User.objects.filter(email__iexact=user.email).count() == 1  # no duplicate


def test_google_login_verifies_unverified_existing_account(api_client, unverified_user):
    claims = {**CLAIMS, "email": unverified_user.email}
    with patch(VERIFY, return_value=claims):
        response = _post(api_client)
    assert response.status_code == 200
    unverified_user.refresh_from_db()
    assert unverified_user.is_email_verified is True


def test_google_login_rejects_invalid_token(api_client):
    with patch(VERIFY, side_effect=ValueError("bad token")):
        response = _post(api_client)
    assert response.status_code == 401
    assert User.objects.filter(email=CLAIMS["email"]).count() == 0


def test_google_login_rejects_unverified_google_email(api_client):
    with patch(VERIFY, return_value={**CLAIMS, "email_verified": False}):
        response = _post(api_client)
    assert response.status_code == 400


def test_google_login_unconfigured_returns_503(api_client, settings):
    settings.GOOGLE_OAUTH_CLIENT_ID = ""
    response = _post(api_client)
    assert response.status_code == 503
