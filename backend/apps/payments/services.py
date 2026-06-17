"""Stripe Connect integration (test mode).

Flow (separate charges & transfers): the doctor pays after the writer accepts →
funds are held on the platform balance → on completion a Transfer of
``amount − commission`` goes to the writer's Express connected account; a
decline/cancel of a paid order refunds the doctor. Every money-moving call is
guarded by ``payment_status`` and uses a deterministic Stripe idempotency key,
so replays (duplicate webhooks, retried requests) never move funds twice.
"""

from __future__ import annotations

import logging
from decimal import ROUND_HALF_UP, Decimal

import stripe
from django.conf import settings
from django.contrib.auth import get_user_model

from apps.orders.models import Order

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY
User = get_user_model()


def _to_cents(amount: Decimal) -> int:
    return int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))


def platform_fee(amount: Decimal) -> Decimal:
    """Platform commission, rounded to the cent."""
    pct = Decimal(str(settings.KESSIA_PLATFORM_FEE_PERCENT))
    return (amount * pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# --- Writer onboarding (Express connected account) -----------------------


def get_or_create_connected_account(user) -> str:
    if user.stripe_account_id:
        return user.stripe_account_id
    account = stripe.Account.create(
        type="express",
        email=user.email,
        capabilities={"transfers": {"requested": True}},
        metadata={"user_id": user.id},
    )
    user.stripe_account_id = account.id
    user.save(update_fields=["stripe_account_id"])
    return account.id


def create_onboarding_link(user) -> str:
    account_id = get_or_create_connected_account(user)
    link = stripe.AccountLink.create(
        account=account_id,
        refresh_url=f"{settings.FRONTEND_URL}/dashboard/writer?stripe=refresh",
        return_url=f"{settings.FRONTEND_URL}/dashboard/writer?stripe=return",
        type="account_onboarding",
    )
    return link.url


def refresh_account_status(user) -> None:
    if not user.stripe_account_id:
        return
    account = stripe.Account.retrieve(user.stripe_account_id)
    user.stripe_charges_enabled = bool(account.charges_enabled)
    user.stripe_payouts_enabled = bool(account.payouts_enabled)
    user.save(update_fields=["stripe_charges_enabled", "stripe_payouts_enabled"])


# --- Payment lifecycle ---------------------------------------------------


# PaymentIntent statuses that can still be confirmed/paid by the client. A
# declined or abandoned payment lands back in one of these, so the same intent
# is reused on retry instead of spawning a duplicate.
_REUSABLE_PI_STATUSES = {
    "requires_payment_method",
    "requires_confirmation",
    "requires_action",
    "processing",
}


def create_payment_intent(order: Order):
    """Create or reuse the PaymentIntent for an accepted order.

    Any Stripe payment method is allowed — the SPA confirms with a ``return_url``,
    so redirect-based methods (and slow ones like SEPA) work too. A still-payable
    existing intent is reused (e.g. the doctor retrying after a decline), and a
    fresh one is minted only once the previous intent is terminal, so re-payment
    never double-charges.
    """
    if order.stripe_payment_intent_id:
        existing = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
        if existing.status in _REUSABLE_PI_STATUSES:
            return existing

    # Keying on the terminal predecessor lets a fresh intent be created after a
    # failed/canceled one, while still de-duping rapid double-submits.
    idempotency_key = f"order-{order.id}-pi"
    if order.stripe_payment_intent_id:
        idempotency_key = f"order-{order.id}-pi-after-{order.stripe_payment_intent_id}"

    intent = stripe.PaymentIntent.create(
        amount=_to_cents(order.amount),
        currency=order.currency.lower(),
        metadata={"order_id": order.id},
        transfer_group=f"order_{order.id}",
        automatic_payment_methods={"enabled": True},
        idempotency_key=idempotency_key,
    )
    # Don't mark the order "processing" just for creating the intent — the
    # doctor hasn't paid yet. The status only advances once the payment is
    # actually submitted (processing) or confirmed (held), driven by the confirm
    # endpoint and webhooks.
    order.stripe_payment_intent_id = intent.id
    order.save(update_fields=["stripe_payment_intent_id", "updated_at"])
    return intent


def mark_payment_held(order: Order) -> bool:
    """On a confirmed payment: hold the funds and start the work. Idempotent."""
    if order.payment_status == Order.PaymentStatus.HELD:
        return False
    order.payment_status = Order.PaymentStatus.HELD
    if order.status == Order.Status.ACCEPTED:
        order.status = Order.Status.IN_PROGRESS
    order.save(update_fields=["payment_status", "status", "updated_at"])
    return True


def mark_payment_failed(order: Order) -> bool:
    """Flag a failed payment so the doctor can retry. No-op once funds moved."""
    if order.payment_status in {
        Order.PaymentStatus.HELD,
        Order.PaymentStatus.RELEASED,
        Order.PaymentStatus.REFUNDED,
    }:
        return False
    order.payment_status = Order.PaymentStatus.FAILED
    order.save(update_fields=["payment_status", "updated_at"])
    return True


def mark_payment_processing(order: Order) -> bool:
    """Mark a payment as genuinely in flight (a slow method awaiting clearing)."""
    if order.payment_status in {
        Order.PaymentStatus.PROCESSING,
        Order.PaymentStatus.HELD,
        Order.PaymentStatus.RELEASED,
        Order.PaymentStatus.REFUNDED,
    }:
        return False
    order.payment_status = Order.PaymentStatus.PROCESSING
    order.save(update_fields=["payment_status", "updated_at"])
    return True


def cancel_pending_payment(order: Order) -> bool:
    """Abort an unconfirmed payment when its order is cancelled/declined.

    Cancels the Stripe intent if it's still cancelable (so a stale checkout tab
    can't pay a dead order) and clears the order back to ``unpaid`` so the
    cancelled order doesn't keep showing a payment in flight. No funds have been
    held, so there is nothing to refund.
    """
    if order.payment_status in {
        Order.PaymentStatus.HELD,
        Order.PaymentStatus.RELEASED,
        Order.PaymentStatus.REFUNDED,
    }:
        return False
    if order.stripe_payment_intent_id:
        try:
            stripe.PaymentIntent.cancel(order.stripe_payment_intent_id)
        except stripe.StripeError:
            pass  # already terminal / not cancelable — nothing to undo
    if order.payment_status != Order.PaymentStatus.UNPAID:
        order.payment_status = Order.PaymentStatus.UNPAID
        order.save(update_fields=["payment_status", "updated_at"])
    return True


def release_payment(order: Order) -> bool:
    """Transfer amount − commission to the writer. Guarded by held status."""
    if order.payment_status != Order.PaymentStatus.HELD:
        return False
    if not order.writer.stripe_account_id:
        # Writer never onboarded; leave funds held until they do (rare in v1).
        logger.warning("Order %s completed but writer has no connected account", order.id)
        return False
    fee = platform_fee(order.amount)
    try:
        transfer = stripe.Transfer.create(
            amount=_to_cents(order.amount - fee),
            currency=order.currency.lower(),
            destination=order.writer.stripe_account_id,
            transfer_group=f"order_{order.id}",
            metadata={"order_id": order.id},
            idempotency_key=f"order-{order.id}-transfer",
        )
    except stripe.StripeError as exc:
        # Most commonly the writer's account isn't payout-ready yet (onboarding
        # not finished -> no "transfers" capability). Don't fail the completion:
        # the work is delivered and accepted. Leave the funds held so the payout
        # can be retried once onboarding completes.
        logger.warning("Order %s transfer failed, funds left held: %s", order.id, exc)
        return False
    order.stripe_transfer_id = transfer.id
    order.application_fee_amount = fee
    order.payment_status = Order.PaymentStatus.RELEASED
    order.save(
        update_fields=[
            "stripe_transfer_id",
            "application_fee_amount",
            "payment_status",
            "updated_at",
        ]
    )
    return True


def refund_payment(order: Order) -> bool:
    """Refund the doctor for a paid order that is declined/cancelled. Guarded."""
    if order.payment_status != Order.PaymentStatus.HELD:
        return False
    stripe.Refund.create(
        payment_intent=order.stripe_payment_intent_id,
        idempotency_key=f"order-{order.id}-refund",
    )
    order.payment_status = Order.PaymentStatus.REFUNDED
    order.save(update_fields=["payment_status", "updated_at"])
    return True


def on_order_status_changed(order: Order) -> None:
    """Hook called by the orders app after a status transition."""
    if order.status == Order.Status.COMPLETED:
        release_payment(order)
    elif order.status in {Order.Status.DECLINED, Order.Status.CANCELLED}:
        if order.payment_status == Order.PaymentStatus.HELD:
            refund_payment(order)
        else:
            # Nothing held yet: abort any unconfirmed intent and clear the
            # status so a cancelled order doesn't linger as "payment in flight".
            cancel_pending_payment(order)


# --- Webhook handling ----------------------------------------------------


def _field(obj, key, default=None):
    """Read a key from a Stripe object or a plain dict.

    Stripe's SDK objects (v15) raise AttributeError on ``.get()``; subscripting
    works on both them and the plain-dict test doubles, so it is the portable
    accessor for webhook payloads.
    """
    try:
        return obj[key]
    except (KeyError, TypeError):
        return default


def _order_from_intent(obj):
    """Resolve the order a PaymentIntent webhook refers to (via its metadata)."""
    order_id = _field(_field(obj, "metadata", {}), "order_id")
    if not order_id:
        return None
    return Order.objects.filter(pk=order_id).first()


def handle_webhook_event(event) -> None:
    etype = event["type"]
    obj = event["data"]["object"]

    if etype == "payment_intent.succeeded":
        order = _order_from_intent(obj)
        if order:
            mark_payment_held(order)

    elif etype == "payment_intent.processing":
        order = _order_from_intent(obj)
        if order:
            mark_payment_processing(order)

    elif etype == "payment_intent.payment_failed":
        order = _order_from_intent(obj)
        if order:
            mark_payment_failed(order)

    elif etype == "account.updated":
        user = User.objects.filter(stripe_account_id=_field(obj, "id")).first()
        if user:
            user.stripe_charges_enabled = bool(_field(obj, "charges_enabled"))
            user.stripe_payouts_enabled = bool(_field(obj, "payouts_enabled"))
            user.save(update_fields=["stripe_charges_enabled", "stripe_payouts_enabled"])
