"""Rate limits on the abuse-prone endpoints (email senders + login).

Throttles count every request (they run before validation), so the tests use
minimal/invalid payloads where convenient — only the status codes matter.
"""

import pytest
from django.core import mail
from django.urls import reverse

pytestmark = pytest.mark.django_db


def test_password_reset_throttled_after_3_per_hour(api_client):
    url = reverse("auth-password-reset")
    for _ in range(3):
        response = api_client.post(url, {"email": "anyone@example.com"}, format="json")
        assert response.status_code == 200
    blocked = api_client.post(url, {"email": "anyone@example.com"}, format="json")
    assert blocked.status_code == 429


def test_password_reset_throttle_caps_emails_sent(api_client, user):
    # Even targeting a real account, no more than 3 emails can be triggered.
    url = reverse("auth-password-reset")
    for _ in range(5):
        api_client.post(url, {"email": user.email}, format="json")
    assert len(mail.outbox) == 3


def test_resend_verification_throttled_after_3_per_hour(unverified_client):
    url = reverse("auth-email-verify-resend")
    for _ in range(3):
        assert unverified_client.post(url).status_code == 200
    assert unverified_client.post(url).status_code == 429


def test_change_email_throttled_after_3_per_hour(auth_client):
    url = reverse("users-change-email")
    payload = {"new_email": "new@example.com", "current_password": "wrong"}
    for _ in range(3):
        # Wrong password -> 400, but the attempt still counts toward the limit.
        assert auth_client.post(url, payload, format="json").status_code == 400
    assert auth_client.post(url, payload, format="json").status_code == 429


def test_login_throttled_after_10_per_minute(api_client, user):
    url = reverse("auth-login")
    payload = {"email": user.email, "password": "wrong-password"}
    for _ in range(10):
        assert api_client.post(url, payload, format="json").status_code == 401
    assert api_client.post(url, payload, format="json").status_code == 429


def test_register_throttled_after_10_per_hour(api_client):
    url = reverse("auth-register")
    for i in range(10):
        response = api_client.post(
            url,
            {
                "email": f"throttle{i}@example.com",
                "password": "SuperSecret123!",
                "accept_terms": True,
            },
            format="json",
        )
        assert response.status_code == 201
    blocked = api_client.post(
        url,
        {"email": "throttle11@example.com", "password": "SuperSecret123!", "accept_terms": True},
        format="json",
    )
    assert blocked.status_code == 429
