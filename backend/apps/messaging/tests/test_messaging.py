import pytest
from django.core import mail
from django.urls import reverse
from rest_framework.test import APIClient

from apps.messaging.models import Conversation, Message
from apps.orders.tests.factories import OrderFactory

pytestmark = pytest.mark.django_db


def _client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def test_start_conversation_from_profile(user, writer_user):
    doctor = _client(user)
    response = doctor.post(
        reverse("conversation-list"),
        {"recipient": writer_user.id, "body": "Bonjour, une question"},
        format="json",
    )
    assert response.status_code == 201
    conv = Conversation.objects.get(pk=response.json()["id"])
    assert conv.order is None
    assert conv.has_participant(user) and conv.has_participant(writer_user)
    assert Message.objects.filter(conversation=conv).count() == 1


def test_conversation_is_deduped_for_a_pair(user, writer_user):
    doctor = _client(user)
    payload = {"recipient": writer_user.id, "body": "hi"}
    doctor.post(reverse("conversation-list"), payload, format="json")
    doctor.post(reverse("conversation-list"), payload, format="json")
    assert Conversation.objects.filter(order__isnull=True).count() == 1


def test_order_conversation_infers_recipient(user, writer_user):
    listing_order = OrderFactory(doctor=user, writer=writer_user)
    doctor = _client(user)
    response = doctor.post(
        reverse("conversation-list"),
        {"order": listing_order.id},
        format="json",
    )
    assert response.status_code == 201
    conv = Conversation.objects.get(pk=response.json()["id"])
    assert conv.order_id == listing_order.id
    assert conv.has_participant(writer_user)


def test_cannot_message_self(user):
    response = _client(user).post(
        reverse("conversation-list"),
        {"recipient": user.id, "body": "hi"},
        format="json",
    )
    assert response.status_code == 400


def test_non_participant_cannot_read_messages(user, writer_user, other_writer_user):
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    response = _client(other_writer_user).get(
        reverse("conversation-messages", args=[conv.id])
    )
    assert response.status_code == 404


def test_unread_count_and_mark_read(user, writer_user):
    doctor = _client(user)
    writer = _client(writer_user)
    conv_id = doctor.post(
        reverse("conversation-list"),
        {"recipient": writer_user.id, "body": "Bonjour"},
        format="json",
    ).json()["id"]

    # Writer sees one unread message.
    convs = writer.get(reverse("conversation-list")).json()["results"]
    assert convs[0]["unread_count"] == 1

    # Opening the thread marks it read.
    writer.get(reverse("conversation-messages", args=[conv_id]))
    convs = writer.get(reverse("conversation-list")).json()["results"]
    assert convs[0]["unread_count"] == 0


def test_email_only_on_first_unread(user, writer_user):
    doctor = _client(user)
    conv_id = doctor.post(
        reverse("conversation-list"),
        {"recipient": writer_user.id, "body": "First"},
        format="json",
    ).json()["id"]
    assert len(mail.outbox) == 1  # first unread -> email

    doctor.post(
        reverse("conversation-messages", args=[conv_id]),
        {"body": "Second"},
        format="json",
    )
    assert len(mail.outbox) == 1  # still unread -> no second email


def test_post_message_broadcasts_to_conversation_group(user, writer_user):
    from unittest.mock import AsyncMock, patch

    from apps.messaging.services import post_message

    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    with patch("apps.messaging.services.get_channel_layer") as mock_get_layer:
        # group_send is awaited via async_to_sync, so it must be a coroutine.
        layer = mock_get_layer.return_value
        layer.group_send = AsyncMock()
        post_message(conv, user, "Salut")
        assert layer.group_send.await_count == 1
        args, _ = layer.group_send.call_args
        assert args[0] == f"conversation_{conv.id}"
        assert args[1]["type"] == "chat.message"
        assert args[1]["message"]["body"] == "Salut"
