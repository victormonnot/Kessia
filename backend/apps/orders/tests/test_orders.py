from decimal import Decimal

import pytest
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.orders.tests.factories import DeliverableFactory, OrderFactory

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
