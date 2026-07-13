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


def test_connect_session_returns_client_secret(writer_auth_client, writer_user):
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Account.create.return_value = MagicMock(id="acct_123")
        mock_stripe.AccountSession.create.return_value = MagicMock(client_secret="accs_secret_x")
        response = writer_auth_client.post(reverse("payments-connect-session"))
    assert response.status_code == 200
    assert response.json()["client_secret"] == "accs_secret_x"


def test_connect_session_forbidden_for_non_writer(auth_client):
    response = auth_client.post(reverse("payments-connect-session"))
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
    # Creating the intent must NOT mark the order paying — the doctor hasn't paid.
    assert order.payment_status == Order.PaymentStatus.UNPAID
    assert order.stripe_payment_intent_id == "pi_123"


def test_pay_intent_is_card_only(auth_client, user):
    order = OrderFactory(doctor=user, status=Order.Status.ACCEPTED, amount=Decimal("100.00"))
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.PaymentIntent.create.return_value = MagicMock(
            id="pi_1", client_secret="cs_1"
        )
        auth_client.post(reverse("payments-pay", kwargs={"order_id": order.id}))
    kwargs = mock_stripe.PaymentIntent.create.call_args.kwargs
    # Bank-debit methods (e.g. SEPA) are reversible for weeks after the
    # irreversible writer payout, so checkout is restricted to cards.
    assert kwargs["payment_method_types"] == ["card"]
    assert "automatic_payment_methods" not in kwargs


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


def test_release_ties_transfer_to_source_charge(auth_client, user, writer_user):
    """The transfer must reference the source charge so it draws from those
    funds even while the platform's available balance is still pending."""
    writer_user.stripe_account_id = "acct_writer"
    writer_user.save(update_fields=["stripe_account_id"])
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing,
        doctor=user,
        status=Order.Status.DELIVERED,
        payment_status=Order.PaymentStatus.HELD,
        amount=Decimal("100.00"),
        stripe_charge_id="ch_source",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Transfer.create.return_value = MagicMock(id="tr_123")
        auth_client.patch(
            reverse("order-detail", args=[order.id]),
            {"status": Order.Status.COMPLETED},
            format="json",
        )
    kwargs = mock_stripe.Transfer.create.call_args.kwargs
    assert kwargs["source_transaction"] == "ch_source"


def test_release_pending_for_writer_releases_held_completed_orders(writer_user):
    """When a writer becomes payout-ready, funds held on already-completed
    orders are released (covers onboarding after completion)."""
    writer_user.stripe_account_id = "acct_writer"
    writer_user.stripe_payouts_enabled = True
    writer_user.save(update_fields=["stripe_account_id", "stripe_payouts_enabled"])
    order = OrderFactory(
        writer=writer_user,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.HELD,
        amount=Decimal("100.00"),
        stripe_charge_id="ch_source",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Transfer.create.return_value = MagicMock(id="tr_123")
        released = services.release_pending_for_writer(writer_user)
    assert released == 1
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.RELEASED


def test_release_pending_for_writer_noop_when_not_payout_ready(writer_user):
    writer_user.stripe_account_id = "acct_writer"
    writer_user.stripe_payouts_enabled = False
    writer_user.save(update_fields=["stripe_account_id", "stripe_payouts_enabled"])
    OrderFactory(
        writer=writer_user,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.HELD,
        amount=Decimal("100.00"),
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        released = services.release_pending_for_writer(writer_user)
    assert released == 0
    mock_stripe.Transfer.create.assert_not_called()


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


# --- Failed payment & retry (any-method support) --------------------------


def test_payment_failed_webhook_marks_order_failed(api_client):
    order = OrderFactory(
        status=Order.Status.ACCEPTED, payment_status=Order.PaymentStatus.PROCESSING
    )
    event = {
        "id": "evt_failed_1",
        "type": "payment_intent.payment_failed",
        "data": {"object": {"metadata": {"order_id": order.id}}},
    }
    url = reverse("payments-webhook")
    with patch("apps.payments.views.stripe") as mock_stripe:
        mock_stripe.Webhook.construct_event.return_value = event
        response = api_client.post(url, **{"HTTP_STRIPE_SIGNATURE": "sig"})
    assert response.status_code == 200
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.FAILED


def test_payment_failed_webhook_does_not_override_held(api_client):
    """A late failure event must never undo an already-held payment."""
    order = OrderFactory(
        status=Order.Status.IN_PROGRESS, payment_status=Order.PaymentStatus.HELD
    )
    event = {
        "id": "evt_failed_2",
        "type": "payment_intent.payment_failed",
        "data": {"object": {"metadata": {"order_id": order.id}}},
    }
    url = reverse("payments-webhook")
    with patch("apps.payments.views.stripe") as mock_stripe:
        mock_stripe.Webhook.construct_event.return_value = event
        api_client.post(url, **{"HTTP_STRIPE_SIGNATURE": "sig"})
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.HELD


def test_pay_is_allowed_after_a_failed_payment(auth_client, user):
    order = OrderFactory(
        doctor=user,
        status=Order.Status.ACCEPTED,
        payment_status=Order.PaymentStatus.FAILED,
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.PaymentIntent.create.return_value = MagicMock(
            id="pi_retry", client_secret="cs_retry"
        )
        response = auth_client.post(reverse("payments-pay", kwargs={"order_id": order.id}))
    assert response.status_code == 200


def test_create_payment_intent_reuses_a_confirmable_intent():
    """Retrying a declined payment reuses the same intent (no duplicate charge)."""
    order = OrderFactory(
        status=Order.Status.ACCEPTED,
        payment_status=Order.PaymentStatus.FAILED,
        stripe_payment_intent_id="pi_existing",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.PaymentIntent.retrieve.return_value = MagicMock(
            id="pi_existing", status="requires_payment_method", client_secret="cs_x"
        )
        intent = services.create_payment_intent(order)
    assert intent.id == "pi_existing"
    mock_stripe.PaymentIntent.create.assert_not_called()


def test_create_payment_intent_replaces_a_terminal_intent():
    """A canceled/terminal intent is replaced with a fresh one under a new key."""
    order = OrderFactory(
        status=Order.Status.ACCEPTED,
        payment_status=Order.PaymentStatus.FAILED,
        stripe_payment_intent_id="pi_old",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.PaymentIntent.retrieve.return_value = MagicMock(
            id="pi_old", status="canceled"
        )
        mock_stripe.PaymentIntent.create.return_value = MagicMock(
            id="pi_new", client_secret="cs_new"
        )
        intent = services.create_payment_intent(order)
    assert intent.id == "pi_new"
    kwargs = mock_stripe.PaymentIntent.create.call_args.kwargs
    assert kwargs["idempotency_key"] == f"order-{order.id}-pi-after-pi_old"
    order.refresh_from_db()
    assert order.stripe_payment_intent_id == "pi_new"


# --- Payment-status lifecycle (no premature/lingering "processing") -------


def test_processing_webhook_marks_order_processing(api_client):
    order = OrderFactory(
        status=Order.Status.ACCEPTED, payment_status=Order.PaymentStatus.UNPAID
    )
    event = {
        "id": "evt_proc_1",
        "type": "payment_intent.processing",
        "data": {"object": {"metadata": {"order_id": order.id}}},
    }
    url = reverse("payments-webhook")
    with patch("apps.payments.views.stripe") as mock_stripe:
        mock_stripe.Webhook.construct_event.return_value = event
        api_client.post(url, **{"HTTP_STRIPE_SIGNATURE": "sig"})
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PROCESSING


def test_cancelling_clears_an_unconfirmed_payment(auth_client, user):
    """Cancelling an order with an unconfirmed intent aborts it and clears the
    status (no lingering 'processing' on a cancelled order)."""
    order = OrderFactory(
        doctor=user,
        status=Order.Status.ACCEPTED,
        payment_status=Order.PaymentStatus.PROCESSING,
        stripe_payment_intent_id="pi_pending",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        response = auth_client.patch(
            reverse("order-detail", args=[order.id]),
            {"status": Order.Status.CANCELLED},
            format="json",
        )
    assert response.status_code == 200
    mock_stripe.PaymentIntent.cancel.assert_called_once_with("pi_pending")
    mock_stripe.Refund.create.assert_not_called()  # nothing was held
    order.refresh_from_db()
    assert order.status == Order.Status.CANCELLED
    assert order.payment_status == Order.PaymentStatus.UNPAID


# --- Fee math -------------------------------------------------------------


def test_platform_fee_is_15_percent():
    assert services.platform_fee(Decimal("100.00")) == Decimal("15.00")
    assert services.platform_fee(Decimal("349.99")) == Decimal("52.50")
