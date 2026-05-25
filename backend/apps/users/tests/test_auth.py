import pytest
from django.urls import reverse

from apps.users.models import User

pytestmark = pytest.mark.django_db


def test_register_creates_user_and_returns_jwt_pair(api_client):
    url = reverse("auth-register")
    payload = {
        "email": "new@example.com",
        "password": "SuperSecret123!",
        "first_name": "New",
        "last_name": "User",
    }
    response = api_client.post(url, payload, format="json")
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["is_writer"] is False
    assert body["access"]
    assert body["refresh"]
    assert User.objects.filter(email="new@example.com").exists()


def test_login_returns_token_pair(api_client, user):
    url = reverse("auth-login")
    response = api_client.post(
        url,
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    assert response.status_code == 200
    body = response.json()
    assert "access" in body and "refresh" in body


def test_refresh_returns_new_access_token(api_client, user):
    login = api_client.post(
        reverse("auth-login"),
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    refresh_token = login.json()["refresh"]

    response = api_client.post(
        reverse("auth-refresh"),
        {"refresh": refresh_token},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["access"]


def test_logout_blacklists_refresh_token(api_client, user):
    login = api_client.post(
        reverse("auth-login"),
        {"email": user.email, "password": "testpass123"},
        format="json",
    )
    refresh_token = login.json()["refresh"]
    access_token = login.json()["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

    logout = api_client.post(
        reverse("auth-logout"),
        {"refresh": refresh_token},
        format="json",
    )
    assert logout.status_code == 205

    reused = api_client.post(
        reverse("auth-refresh"),
        {"refresh": refresh_token},
        format="json",
    )
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
