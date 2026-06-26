import pytest
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
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


def _pdf(name="brief.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 fake content", content_type="application/pdf")


def test_send_message_with_attachment(user, writer_user):
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    response = _client(user).post(
        reverse("conversation-messages", args=[conv.id]),
        {"attachment": _pdf()},  # file-only message, no body
        format="multipart",
    )
    assert response.status_code == 201
    data = response.json()
    assert data["attachment_name"] == "brief.pdf"
    assert data["attachment_size"] > 0
    assert Message.objects.get(pk=data["id"]).attachment


def test_message_requires_body_or_attachment(user, writer_user):
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    response = _client(user).post(
        reverse("conversation-messages", args=[conv.id]), {}, format="multipart"
    )
    assert response.status_code == 400


def test_rejects_disallowed_attachment_type(user, writer_user):
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    bad = SimpleUploadedFile("evil.exe", b"MZ", content_type="application/octet-stream")
    response = _client(user).post(
        reverse("conversation-messages", args=[conv.id]),
        {"attachment": bad},
        format="multipart",
    )
    assert response.status_code == 400
    assert Message.objects.filter(conversation=conv).count() == 0


def test_participant_can_download_attachment(user, writer_user):
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    _client(user).post(
        reverse("conversation-messages", args=[conv.id]),
        {"attachment": _pdf()},
        format="multipart",
    )
    msg = Message.objects.get(conversation=conv)
    response = _client(writer_user).get(
        reverse("conversation-download-attachment", args=[conv.id, msg.id])
    )
    assert response.status_code == 200


def test_non_participant_cannot_download_attachment(user, writer_user, other_writer_user):
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    _client(user).post(
        reverse("conversation-messages", args=[conv.id]),
        {"attachment": _pdf()},
        format="multipart",
    )
    msg = Message.objects.get(conversation=conv)
    response = _client(other_writer_user).get(
        reverse("conversation-download-attachment", args=[conv.id, msg.id])
    )
    assert response.status_code == 404


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


def test_message_sending_is_throttled(user, writer_user):
    # A scripted flood is capped while reading stays open. Patch in a tiny rate
    # (the real one is 30/min) so the test only needs a couple of sends.
    from unittest.mock import patch

    from django.core.cache import cache

    from apps.common.throttles import MessageThrottle

    cache.clear()
    conv = Conversation.objects.create(user_low=user, user_high=writer_user)
    client = _client(user)
    url = reverse("conversation-messages", args=[conv.id])
    with patch.object(MessageThrottle, "THROTTLE_RATES", {"messaging": "1/min"}):
        assert client.post(url, {"body": "un"}, format="multipart").status_code == 201
        assert client.post(url, {"body": "deux"}, format="multipart").status_code == 429
        # Reads are not throttled even after the send limit is reached.
        assert client.get(url).status_code == 200
    cache.clear()
