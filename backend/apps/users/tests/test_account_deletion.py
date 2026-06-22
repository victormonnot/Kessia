"""Account deletion = anonymise-in-place (RGPD erasure), not hard delete.

Covers the two failure modes the old hard-delete had:
  - a doctor deleting their account destroyed the *writer's* order + review,
  - a writer who had sold anything was blocked outright (ProtectedError -> 409).
Both are fixed by anonymising in place and keeping the transactional rows.
"""

import pytest
from django.urls import reverse

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
    assert writer_user.is_active is True
    assert writer_user.deleted_at is None


def test_writer_with_sold_listing_can_now_delete(api_client, writer_user, user):
    # Previously this raised ProtectedError -> 409 and the writer was stuck.
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
    # Their listings are pulled from the marketplace.
    listing.refresh_from_db()
    assert listing.is_published is False


def test_delete_deferred_while_order_in_flight(api_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    OrderFactory(
        listing=listing,
        doctor=user,
        writer=writer_user,
        status=Order.Status.IN_PROGRESS,
        payment_status=Order.PaymentStatus.HELD,
    )

    api_client.force_authenticate(user=user)
    assert _delete(api_client).status_code == 202  # accepted but deferred
    user.refresh_from_db()
    assert user.is_active is False  # deactivated immediately
    assert user.deletion_requested_at is not None
    assert user.deleted_at is None  # not scrubbed yet
    assert user.email == "doctor@example.com"  # PII kept while the contract is live


def test_pending_deletion_finalized_when_order_settles(api_client, user, writer_user):
    from apps.users.services import request_account_deletion

    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing, doctor=user, writer=writer_user, status=Order.Status.PENDING
    )

    # Writer asks to delete while the order is still active -> deferred.
    assert request_account_deletion(writer_user) is False
    writer_user.refresh_from_db()
    assert writer_user.deleted_at is None
    assert writer_user.email == "writer@example.com"

    # Doctor cancels the (unpaid) pending order -> it settles with no money to
    # move, and the writer's deferred erasure is finalised automatically.
    api_client.force_authenticate(user=user)
    resp = api_client.patch(
        reverse("order-detail", args=[order.id]),
        {"status": Order.Status.CANCELLED},
        format="json",
    )
    assert resp.status_code == 200
    writer_user.refresh_from_db()
    assert writer_user.deleted_at is not None
    assert writer_user.email == f"deleted-{writer_user.pk}@kessia.invalid"


def test_anonymized_user_session_is_locked_out(api_client, user):
    # Mint a real access token *before* deletion, then prove it stops working.
    from rest_framework_simplejwt.tokens import AccessToken

    token = str(AccessToken.for_user(user))
    api_client.force_authenticate(user=user)
    assert _delete(api_client).status_code == 204

    # Real JWT path now (not force_authenticate): is_active=False -> 401.
    api_client.force_authenticate(user=None)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    assert api_client.get(reverse("users-me")).status_code == 401
