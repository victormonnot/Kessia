import pytest
from django.urls import reverse

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.orders.tests.factories import OrderFactory

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


def test_doctor_cannot_change_status(auth_client, user):
    order = OrderFactory(doctor=user)
    response = auth_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.ACCEPTED},
        format="json",
    )
    assert response.status_code == 403


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
