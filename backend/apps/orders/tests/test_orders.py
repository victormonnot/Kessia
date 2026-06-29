from datetime import timedelta
from decimal import Decimal

import pytest
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order, OrderEvent
from apps.orders.services import record_event
from apps.payments.services import mark_payment_held
from apps.orders.tests.factories import (
    DeliverableFactory,
    OrderAttachmentFactory,
    OrderFactory,
)

pytestmark = pytest.mark.django_db


def test_doctor_can_place_order(auth_client, user):
    listing = ListingFactory()
    response = auth_client.post(
        reverse("order-list"),
        {"listing": listing.id, "message": "Need it next week"},
        format="json",
    )
    assert response.status_code == 201
    assert Order.objects.filter(doctor=user, listing=listing).count() == 1


def test_order_snapshots_writer_and_amount(auth_client, user):
    listing = ListingFactory(price=Decimal("420.00"))
    response = auth_client.post(
        reverse("order-list"),
        {"listing": listing.id, "message": "Snapshot please"},
        format="json",
    )
    assert response.status_code == 201
    order = Order.objects.get(doctor=user, listing=listing)
    assert order.writer_id == listing.writer_id
    assert order.amount == Decimal("420.00")
    assert order.payment_status == Order.PaymentStatus.UNPAID
    assert order.currency == "EUR"


def test_amount_snapshot_survives_later_price_change(auth_client, user):
    listing = ListingFactory(price=Decimal("300.00"))
    auth_client.post(
        reverse("order-list"),
        {"listing": listing.id, "message": "Lock the price"},
        format="json",
    )
    listing.price = Decimal("999.00")
    listing.save(update_fields=["price"])
    order = Order.objects.get(doctor=user, listing=listing)
    assert order.amount == Decimal("300.00")


def test_cannot_order_own_listing(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    response = writer_auth_client.post(
        reverse("order-list"),
        {"listing": listing.id, "message": "Self order"},
        format="json",
    )
    assert response.status_code == 400


def test_writer_can_accept_order(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing)
    response = writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.ACCEPTED},
        format="json",
    )
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.ACCEPTED


def test_doctor_cannot_accept_own_order(auth_client, user):
    # Accepting is a writer-only action; the doctor attempting it is an invalid
    # transition for their role (400), not a permission error.
    order = OrderFactory(doctor=user)
    response = auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.ACCEPTED},
        format="json",
    )
    assert response.status_code == 400


def test_non_participant_cannot_see_order(other_writer_auth_client, user):
    order = OrderFactory(doctor=user)
    response = other_writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.ACCEPTED},
        format="json",
    )
    # Order is not in the stranger's queryset -> 404.
    assert response.status_code == 404


def test_invalid_transition_rejected(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.PENDING)
    response = writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.DELIVERED},
        format="json",
    )
    assert response.status_code == 400


def test_order_list_scoped_to_participant(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    OrderFactory(listing=listing, doctor=user)
    OrderFactory()  # unrelated order
    response = auth_client.get(reverse("order-list"))
    assert response.status_code == 200
    assert response.json()["count"] == 1


# --- Lifecycle ------------------------------------------------------------


def test_writer_can_decline(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.PENDING)
    response = writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.DECLINED},
        format="json",
    )
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.DECLINED


def test_doctor_can_cancel_accepted_order(auth_client, user):
    order = OrderFactory(doctor=user, status=Order.Status.ACCEPTED)
    response = auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.CANCELLED},
        format="json",
    )
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.CANCELLED


def test_writer_cannot_complete(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.DELIVERED)
    response = writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.COMPLETED},
        format="json",
    )
    assert response.status_code == 400


def test_cannot_set_delivered_via_patch(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.IN_PROGRESS)
    response = writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.DELIVERED},
        format="json",
    )
    assert response.status_code == 400


# --- Deliverables ---------------------------------------------------------


def test_writer_delivers_by_uploading_file(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.IN_PROGRESS)
    upload = SimpleUploadedFile("paper.pdf", b"%PDF-1.4 data", content_type="application/pdf")
    response = writer_auth_client.post(
        reverse("order-deliverables", args=[order.id]),
        {"file": upload},
        format="multipart",
    )
    assert response.status_code == 201
    order.refresh_from_db()
    assert order.status == Order.Status.DELIVERED
    assert order.deliverables.count() == 1


def test_deliverable_upload_rejects_disallowed_type(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.IN_PROGRESS)
    upload = SimpleUploadedFile("malware.exe", b"MZ", content_type="application/octet-stream")
    response = writer_auth_client.post(
        reverse("order-deliverables", args=[order.id]),
        {"file": upload},
        format="multipart",
    )
    assert response.status_code == 400
    assert order.deliverables.count() == 0


def test_deliverable_upload_rejects_oversized_file(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.IN_PROGRESS)
    too_big = SimpleUploadedFile(
        "huge.pdf", b"x" * (25 * 1024 * 1024 + 1), content_type="application/pdf"
    )
    response = writer_auth_client.post(
        reverse("order-deliverables", args=[order.id]),
        {"file": too_big},
        format="multipart",
    )
    assert response.status_code == 400
    assert order.deliverables.count() == 0


def test_doctor_cannot_upload_deliverable(auth_client, user):
    order = OrderFactory(doctor=user, status=Order.Status.IN_PROGRESS)
    upload = SimpleUploadedFile("paper.pdf", b"data")
    response = auth_client.post(
        reverse("order-deliverables", args=[order.id]),
        {"file": upload},
        format="multipart",
    )
    assert response.status_code == 403


def test_doctor_download_gated_until_delivery(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user, status=Order.Status.IN_PROGRESS)
    deliverable = DeliverableFactory(order=order)
    url = reverse(
        "order-download-deliverable",
        kwargs={"pk": order.id, "deliverable_id": deliverable.id},
    )

    blocked = auth_client.get(url)
    assert blocked.status_code == 403

    order.status = Order.Status.DELIVERED
    order.save(update_fields=["status"])
    allowed = auth_client.get(url)
    assert allowed.status_code == 200


# --- Notifications --------------------------------------------------------


def test_emails_fire_on_lifecycle_events(user, writer_user):
    # Distinct clients: the shared auth_client/writer_auth_client fixtures reuse
    # one APIClient instance, so we authenticate two of our own here.
    doctor_client = APIClient()
    doctor_client.force_authenticate(user)
    writer_client = APIClient()
    writer_client.force_authenticate(writer_user)

    listing = ListingFactory(writer=writer_user)

    placed = doctor_client.post(
        reverse("order-list"),
        {"listing": listing.id, "message": "Bonjour"},
        format="json",
    )
    assert placed.status_code == 201
    order_id = placed.json()["id"]
    assert len(mail.outbox) == 1  # order_placed -> writer

    writer_client.patch(
        reverse("order-detail", args=[order_id]),
        {"status": Order.Status.ACCEPTED},
        format="json",
    )
    assert len(mail.outbox) == 2  # order_accepted -> doctor


# --- Dashboard endpoints --------------------------------------------------


def test_orders_role_filter_scopes_results(user, writer_user):
    doctor_client = APIClient()
    doctor_client.force_authenticate(user)
    listing = ListingFactory(writer=writer_user)
    OrderFactory(listing=listing, doctor=user)  # user is the doctor here

    as_doctor = doctor_client.get(reverse("order-list"), {"role": "doctor"})
    assert as_doctor.json()["count"] == 1
    as_writer = doctor_client.get(reverse("order-list"), {"role": "writer"})
    assert as_writer.json()["count"] == 0


# --- Activity log (OrderEvent timeline) -----------------------------------


def test_placing_an_order_records_a_placed_event(auth_client, user):
    listing = ListingFactory()
    response = auth_client.post(
        reverse("order-list"),
        {"listing": listing.id, "message": "Need it"},
        format="json",
    )
    order = Order.objects.get(pk=response.json()["id"])
    assert list(order.events.values_list("type", flat=True)) == [OrderEvent.Type.PLACED]
    assert order.events.first().actor_id == user.id


def test_accept_and_deliver_record_events(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.PENDING)

    writer_auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.ACCEPTED},
        format="json",
    )
    # Payment normally moves accepted -> in_progress; shortcut it here.
    order.refresh_from_db()
    order.status = Order.Status.IN_PROGRESS
    order.save(update_fields=["status"])

    upload = SimpleUploadedFile("paper.pdf", b"%PDF-1.4 data", content_type="application/pdf")
    writer_auth_client.post(
        reverse("order-deliverables", args=[order.id]),
        {"file": upload},
        format="multipart",
    )

    types = list(order.events.values_list("type", flat=True))
    assert OrderEvent.Type.ACCEPTED in types
    assert OrderEvent.Type.DELIVERED in types


def test_adding_document_records_event(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    upload = SimpleUploadedFile("brief.pdf", b"%PDF-1.4 data", content_type="application/pdf")

    auth_client.post(
        reverse("order-attachments", args=[order.id]),
        {"file": upload},
        format="multipart",
    )
    event = order.events.get(type=OrderEvent.Type.DOCUMENT_ADDED)
    assert event.actor_id == user.id
    assert "brief" in event.metadata.get("filename", "")


def test_order_detail_exposes_events_in_order(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    record_event(order, OrderEvent.Type.PLACED, actor=user)
    record_event(order, OrderEvent.Type.PAID, actor=user, amount="250.00")

    response = auth_client.get(reverse("order-detail", args=[order.id]))
    assert response.status_code == 200
    types = [e["type"] for e in response.json()["events"]]
    assert types == ["placed", "paid"]


# --- Order attachments (brief / source documents) -------------------------


def test_doctor_can_upload_source_document(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    upload = SimpleUploadedFile("brief.pdf", b"%PDF-1.4 data", content_type="application/pdf")

    response = auth_client.post(
        reverse("order-attachments", args=[order.id]),
        {"file": upload, "note": "Mes consignes"},
        format="multipart",
    )
    assert response.status_code == 201
    assert order.attachments.count() == 1
    assert order.attachments.first().uploaded_by_id == user.id

    # It shows up in the list and the order detail.
    listed = auth_client.get(reverse("order-attachments", args=[order.id]))
    assert len(listed.json()) == 1
    detail = auth_client.get(reverse("order-detail", args=[order.id]))
    assert len(detail.json()["attachments"]) == 1


def test_writer_can_download_source_document(writer_auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    attachment = OrderAttachmentFactory(order=order, uploaded_by=user)

    response = writer_auth_client.get(
        reverse("order-download-attachment", args=[order.id, attachment.id])
    )
    assert response.status_code == 200


def test_non_participant_cannot_access_attachments(
    other_writer_auth_client, user, writer_user
):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    attachment = OrderAttachmentFactory(order=order, uploaded_by=user)

    assert (
        other_writer_auth_client.get(
            reverse("order-attachments", args=[order.id])
        ).status_code
        == 404
    )
    assert (
        other_writer_auth_client.get(
            reverse("order-download-attachment", args=[order.id, attachment.id])
        ).status_code
        == 404
    )


def test_cannot_attach_to_closed_order(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user, status=Order.Status.COMPLETED)
    upload = SimpleUploadedFile("late.pdf", b"%PDF-1.4 data", content_type="application/pdf")

    response = auth_client.post(
        reverse("order-attachments", args=[order.id]),
        {"file": upload},
        format="multipart",
    )
    assert response.status_code == 400
    assert order.attachments.count() == 0


def test_attachment_upload_rejects_disallowed_type(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    upload = SimpleUploadedFile("malware.exe", b"MZ", content_type="application/octet-stream")

    response = auth_client.post(
        reverse("order-attachments", args=[order.id]),
        {"file": upload},
        format="multipart",
    )
    assert response.status_code == 400
    assert order.attachments.count() == 0


# --- Revisions & deadlines -------------------------------------------------


def test_doctor_can_request_revision(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user, status=Order.Status.DELIVERED)

    response = auth_client.post(
        reverse("order-request-revision", args=[order.id]),
        {"note": "Merci de revoir la conclusion."},
        format="json",
    )
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.IN_PROGRESS
    assert order.revision_count == 1
    assert order.events.filter(type=OrderEvent.Type.REVISION_REQUESTED).exists()
    # The writer is notified.
    assert any(writer_user.email in m.to for m in mail.outbox)


def test_request_revision_requires_delivered_status(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user, status=Order.Status.IN_PROGRESS)
    response = auth_client.post(
        reverse("order-request-revision", args=[order.id]), {}, format="json"
    )
    assert response.status_code == 400
    order.refresh_from_db()
    assert order.revision_count == 0


def test_only_doctor_can_request_revision(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.DELIVERED)
    response = writer_auth_client.post(
        reverse("order-request-revision", args=[order.id]), {}, format="json"
    )
    assert response.status_code == 403


def test_due_at_set_when_payment_held(writer_user):
    listing = ListingFactory(writer=writer_user, turnaround_days=7)
    order = OrderFactory(listing=listing, status=Order.Status.ACCEPTED)
    assert order.due_at is None

    mark_payment_held(order)
    order.refresh_from_db()
    assert order.status == Order.Status.IN_PROGRESS
    expected = (timezone.now() + timedelta(days=7)).date()
    assert order.due_at is not None and order.due_at.date() == expected


def test_order_participant_gets_conversation(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    url = reverse("order-conversation", args=[order.id])

    first = auth_client.get(url)
    assert first.status_code == 200
    assert first.json()["order"] == order.id

    # Idempotent: a second access returns the same (deduped) conversation.
    second = auth_client.get(url)
    assert second.json()["id"] == first.json()["id"]


def test_non_participant_cannot_get_order_conversation(
    other_writer_auth_client, user, writer_user
):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user)
    response = other_writer_auth_client.get(
        reverse("order-conversation", args=[order.id])
    )
    assert response.status_code == 404


def test_earnings_summary_for_writer(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    OrderFactory(
        listing=listing,
        status=Order.Status.IN_PROGRESS,
        payment_status=Order.PaymentStatus.HELD,
        amount=Decimal("200.00"),
    )
    OrderFactory(
        listing=listing,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.RELEASED,
        amount=Decimal("100.00"),
        application_fee_amount=Decimal("15.00"),
    )
    response = writer_auth_client.get(reverse("order-earnings"))
    assert response.status_code == 200
    body = response.json()
    assert body["in_escrow"] == "200.00"
    assert body["earned"] == "85.00"  # 100 - 15% commission
