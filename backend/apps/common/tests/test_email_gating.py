"""Email-verification gating: unverified users can browse and manage their
account, but can't create content, transact, or send messages."""

import pytest
from django.urls import reverse

from apps.messaging.models import Conversation
from apps.users.models import User

pytestmark = pytest.mark.django_db


# --- Blocked for unverified users ------------------------------------------
# Bodies can be empty: permission checks run before serializer validation, so a
# blocked request 403s regardless of payload.


def test_unverified_cannot_create_listing(unverified_client):
    # unverified_user is a writer, so it clears IsWriter and is stopped purely
    # by the email gate.
    response = unverified_client.post(reverse("listing-list"), {}, format="json")
    assert response.status_code == 403


def test_unverified_cannot_create_request(unverified_client):
    response = unverified_client.post(reverse("request-list"), {}, format="json")
    assert response.status_code == 403


def test_unverified_cannot_start_conversation(unverified_client, writer_user):
    response = unverified_client.post(
        reverse("conversation-list"),
        {"recipient": writer_user.id, "body": "Bonjour"},
        format="json",
    )
    assert response.status_code == 403


def test_unverified_can_read_chat_but_cannot_send(unverified_client, unverified_user, writer_user):
    low, high = sorted([unverified_user, writer_user], key=lambda u: u.id)
    conv = Conversation.objects.create(user_low=low, user_high=high)

    # Reading the thread is a safe method -> allowed.
    read = unverified_client.get(reverse("conversation-messages", args=[conv.id]))
    assert read.status_code == 200

    # Sending is a write -> blocked.
    send = unverified_client.post(
        reverse("conversation-messages", args=[conv.id]), {"body": "hi"}, format="json"
    )
    assert send.status_code == 403


# --- Still allowed for unverified users ------------------------------------


def test_unverified_can_browse_listings(unverified_client):
    assert unverified_client.get(reverse("listing-list")).status_code == 200


def test_unverified_can_edit_their_profile(unverified_client, unverified_user):
    response = unverified_client.patch(
        reverse("users-me"), {"first_name": "Renamed"}, format="json"
    )
    assert response.status_code == 200
    unverified_user.refresh_from_db()
    assert unverified_user.first_name == "Renamed"


def test_unverified_can_activate_writer(api_client):
    doctor = User.objects.create_user(email="newdoc@example.com", password="testpass123")
    api_client.force_authenticate(doctor)
    response = api_client.post(reverse("users-activate-writer"))
    assert response.status_code == 200
    doctor.refresh_from_db()
    assert doctor.is_writer is True
