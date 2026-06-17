from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
import stripe
from django.urls import reverse

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.orders.tests.factories import OrderFactory
from apps.payments import services
from apps.payments.models import StripeEvent

pytestmark = pytest.mark.django_db


# --- Onboarding -----------------------------------------------------------


def test_onboard_creates_account_and_link(writer_auth_client, writer_user):
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Account.create.return_value = MagicMock(id="acct_123")
        mock_stripe.AccountLink.create.return_value = MagicMock(url="https://connect.test/x")
        response = writer_auth_client.post(reverse("payments-connect-onboard"))
    assert response.status_code == 200
    assert response.json()["url"] == "https://connect.test/x"
    writer_user.refresh_from_db()
    assert writer_user.stripe_account_id == "acct_123"


def test_onboard_forbidden_for_non_writer(auth_client):
    response = auth_client.post(reverse("payments-connect-onboard"))
    assert response.status_code == 403


# --- Pay (doctor, after acceptance) --------------------------------------


def test_pay_creates_intent_with_idempotency_key(auth_client, user):
    order = OrderFactory(doctor=user, status=Order.Status.ACCEPTED, amount=Decimal("100.00"))
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.PaymentIntent.create.return_value = MagicMock(
            id="pi_123", client_secret="cs_123"
        )
        response = auth_client.post(reverse("payments-pay", kwargs={"order_id": order.id}))
    assert response.status_code == 200
    assert response.json()["client_secret"] == "cs_123"
    kwargs = mock_stripe.PaymentIntent.create.call_args.kwargs
    assert kwargs["amount"] == 10000  # cents
    assert kwargs["idempotency_key"] == f"order-{order.id}-pi"
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PROCESSING
    assert order.stripe_payment_intent_id == "pi_123"


def test_pay_requires_accepted_status(auth_client, user):
    order = OrderFactory(doctor=user, status=Order.Status.PENDING)
    response = auth_client.post(reverse("payments-pay", kwargs={"order_id": order.id}))
    assert response.status_code == 400


def test_pay_forbidden_for_non_doctor(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, status=Order.Status.ACCEPTED)
    response = writer_auth_client.post(reverse("payments-pay", kwargs={"order_id": order.id}))
    assert response.status_code == 403


# --- mark_payment_held ----------------------------------------------------


def test_mark_payment_held_starts_work_and_is_idempotent():
    order = OrderFactory(status=Order.Status.ACCEPTED)
    assert services.mark_payment_held(order) is True
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.HELD
    assert order.status == Order.Status.IN_PROGRESS
    # Replaying must be a no-op (no double effect).
    assert services.mark_payment_held(order) is False


# --- Webhook --------------------------------------------------------------


def test_webhook_is_idempotent(api_client):
    order = OrderFactory(status=Order.Status.ACCEPTED)
    event = {
        "id": "evt_1",
        "type": "payment_intent.succeeded",
        "data": {"object": {"metadata": {"order_id": order.id}}},
    }
    url = reverse("payments-webhook")
    with patch("apps.payments.views.stripe") as mock_stripe:
        mock_stripe.Webhook.construct_event.return_value = event
        first = api_client.post(url, **{"HTTP_STRIPE_SIGNATURE": "sig"})
        second = api_client.post(url, **{"HTTP_STRIPE_SIGNATURE": "sig"})
    assert first.status_code == 200
    assert second.status_code == 200
    assert StripeEvent.objects.filter(event_id="evt_1").count() == 1
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.HELD  # processed exactly once


def test_webhook_bad_signature_returns_400(api_client):
    url = reverse("payments-webhook")
    with patch("apps.payments.views.stripe") as mock_stripe:
        mock_stripe.Webhook.construct_event.side_effect = ValueError("bad sig")
        response = api_client.post(url, **{"HTTP_STRIPE_SIGNATURE": "sig"})
    assert response.status_code == 400


# --- Release on completion (held -> released, minus commission) -----------


def test_release_on_completion_transfers_amount_minus_fee(auth_client, user, writer_user):
    writer_user.stripe_account_id = "acct_writer"
    writer_user.save(update_fields=["stripe_account_id"])
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing,
        doctor=user,
        status=Order.Status.DELIVERED,
        payment_status=Order.PaymentStatus.HELD,
        amount=Decimal("100.00"),
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Transfer.create.return_value = MagicMock(id="tr_123")
        response = auth_client.patch(
            reverse("order-detail", args=[order.id]),
            {"status": Order.Status.COMPLETED},
            format="json",
        )
    assert response.status_code == 200
    kwargs = mock_stripe.Transfer.create.call_args.kwargs
    assert kwargs["amount"] == 8500  # 100.00 - 15% = 85.00
    assert kwargs["destination"] == "acct_writer"
    assert kwargs["idempotency_key"] == f"order-{order.id}-transfer"
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.RELEASED
    assert order.application_fee_amount == Decimal("15.00")


def test_completion_without_payment_does_not_transfer(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing,
        doctor=user,
        status=Order.Status.DELIVERED,  # unpaid (payment_status defaults to unpaid)
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        auth_client.patch(
            reverse("order-detail", args=[order.id]),
            {"status": Order.Status.COMPLETED},
            format="json",
        )
        mock_stripe.Transfer.create.assert_not_called()


def test_release_failure_leaves_funds_held(auth_client, user, writer_user):
    """A transfer error (e.g. writer not payout-ready) must not crash completion:
    the order still completes and the funds stay held for a later retry."""
    writer_user.stripe_account_id = "acct_writer"
    writer_user.save(update_fields=["stripe_account_id"])
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing,
        doctor=user,
        status=Order.Status.DELIVERED,
        payment_status=Order.PaymentStatus.HELD,
        amount=Decimal("100.00"),
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.StripeError = stripe.StripeError
        mock_stripe.Transfer.create.side_effect = stripe.StripeError("account not payout-ready")
        response = auth_client.patch(
            reverse("order-detail", args=[order.id]),
            {"status": Order.Status.COMPLETED},
            format="json",
        )
    assert response.status_code == 200  # completion succeeds despite payout failure
    order.refresh_from_db()
    assert order.status == Order.Status.COMPLETED
    assert order.payment_status == Order.PaymentStatus.HELD  # funds preserved, not lost


# --- Refund on cancel-after-payment --------------------------------------


def test_cancel_after_payment_refunds_doctor(auth_client, user):
    order = OrderFactory(
        doctor=user,
        status=Order.Status.IN_PROGRESS,
        payment_status=Order.PaymentStatus.HELD,
        stripe_payment_intent_id="pi_123",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Refund.create.return_value = MagicMock(id="re_123")
        response = auth_client.patch(
            reverse("order-detail", args=[order.id]),
            {"status": Order.Status.CANCELLED},
            format="json",
        )
    assert response.status_code == 200
    kwargs = mock_stripe.Refund.create.call_args.kwargs
    assert kwargs["payment_intent"] == "pi_123"
    assert kwargs["idempotency_key"] == f"order-{order.id}-refund"
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.REFUNDED


# --- Fee math -------------------------------------------------------------


def test_platform_fee_is_15_percent():
    assert services.platform_fee(Decimal("100.00")) == Decimal("15.00")
    assert services.platform_fee(Decimal("349.99")) == Decimal("52.50")
