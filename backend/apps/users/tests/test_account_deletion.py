"""Account deletion = anonymise-in-place (RGPD erasure), not hard delete.

Refused while an order is in flight or funds are unsettled; otherwise the PII is
wiped, listings without orders are deleted (the rest hidden), and the
transactional records (orders, reviews) are kept — so the counterparty's data
and the reviews survive (the deleted user shows as "Utilisateur supprimé").
"""

import pytest
from django.urls import reverse

from apps.listings.models import Listing
from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.orders.tests.factories import OrderFactory
from apps.reviews.models import Review

pytestmark = pytest.mark.django_db


def _delete(client, password="testpass123"):
    return client.delete(
        reverse("users-me"), {"current_password": password}, format="json"
    )


def test_doctor_delete_preserves_writers_order_and_review(api_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing,
        doctor=user,
        writer=writer_user,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.RELEASED,
    )
    review = Review.objects.create(order=order, doctor=user, writer=writer_user, rating=5)

    api_client.force_authenticate(user=user)
    assert _delete(api_client).status_code == 204

    # The writer's order and earned review survive; the writer is untouched.
    assert Order.objects.filter(pk=order.pk).exists()
    assert Review.objects.filter(pk=review.pk).exists()
    writer_user.refresh_from_db()
    assert writer_user.is_active is True and writer_user.deleted_at is None


def test_writer_with_sold_listing_can_delete(api_client, writer_user, user):
    listing = ListingFactory(writer=writer_user)
    OrderFactory(
        listing=listing,
        doctor=user,
        writer=writer_user,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.RELEASED,
    )

    api_client.force_authenticate(user=writer_user)
    assert _delete(api_client).status_code == 204

    writer_user.refresh_from_db()
    assert writer_user.deleted_at is not None
    # A listing backing an order is hidden (kept, since the order references it).
    listing.refresh_from_db()
    assert listing.removed_at is not None


def test_listing_without_orders_is_deleted(api_client, writer_user):
    listing = ListingFactory(writer=writer_user)  # no orders
    api_client.force_authenticate(user=writer_user)
    assert _delete(api_client).status_code == 204
    assert not Listing.objects.filter(pk=listing.pk).exists()


def test_delete_blocked_while_order_in_flight(api_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    OrderFactory(
        listing=listing,
        doctor=user,
        writer=writer_user,
        status=Order.Status.IN_PROGRESS,
        payment_status=Order.PaymentStatus.HELD,
    )
    api_client.force_authenticate(user=user)
    resp = _delete(api_client)
    assert resp.status_code == 409
    assert "commande en cours" in resp.json()["detail"]
    user.refresh_from_db()
    assert user.deleted_at is None  # not deleted


def test_delete_blocked_while_funds_unsettled(api_client, user, writer_user):
    # A completed order whose payout hasn't gone through yet (funds still held).
    OrderFactory(
        doctor=user,
        writer=writer_user,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.HELD,
    )
    api_client.force_authenticate(user=writer_user)
    resp = _delete(api_client)
    assert resp.status_code == 409
    assert "fonds" in resp.json()["detail"].lower()
    writer_user.refresh_from_db()
    assert writer_user.deleted_at is None


def test_delete_anonymizes_pii(api_client, user):
    api_client.force_authenticate(user=user)
    assert _delete(api_client).status_code == 204
    user.refresh_from_db()
    assert user.email == f"deleted-{user.pk}@kessia.invalid"
    assert user.first_name == "" and user.last_name == ""
    assert user.is_active is False and user.deleted_at is not None
    assert not user.has_usable_password()


def test_deleted_user_session_is_locked_out(api_client, user):
    from rest_framework_simplejwt.tokens import AccessToken

    token = str(AccessToken.for_user(user))
    api_client.force_authenticate(user=user)
    assert _delete(api_client).status_code == 204

    api_client.force_authenticate(user=None)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    assert api_client.get(reverse("users-me")).status_code == 401
