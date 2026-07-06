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
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

import stripe
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.orders.models import Order, OrderEvent
from apps.orders.services import record_event

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


def create_account_session(user) -> str:
    """Client secret for Stripe's *embedded* onboarding component.

    Lets the writer complete Connect onboarding inside Kessia (no redirect to
    Stripe) while Stripe still handles the KYC / bank collection and compliance.
    """
    account_id = get_or_create_connected_account(user)
    session = stripe.AccountSession.create(
        account=account_id,
        components={"account_onboarding": {"enabled": True}},
    )
    return session.client_secret


def refresh_account_status(user) -> None:
    if not user.stripe_account_id:
        return
    account = stripe.Account.retrieve(user.stripe_account_id)
    user.stripe_charges_enabled = bool(account.charges_enabled)
    user.stripe_payouts_enabled = bool(account.payouts_enabled)
    user.save(update_fields=["stripe_charges_enabled", "stripe_payouts_enabled"])
    # Onboarding may have just completed: release any payouts that were held
    # because the account wasn't ready when the order was completed.
    if user.stripe_payouts_enabled:
        release_pending_for_writer(user)


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

    Card only (``payment_method_types=["card"]``). The platform pays the writer
    out at completion and that transfer is effectively irreversible, so we don't
    accept bank-debit methods (e.g. SEPA) that the payer can reverse for weeks
    after the payout has already gone. Card chargebacks remain possible but are a
    smaller, contestable risk we accept here (see docs/LIMITATIONS.md). A
    still-payable existing intent is reused (e.g. the doctor retrying after a
    decline), and a fresh one is minted only once the previous intent is
    terminal, so re-payment never double-charges.
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
        payment_method_types=["card"],
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
        # Work starts now: set the delivery deadline from the listing turnaround
        # (proposal-based orders have no agreed turnaround, so no deadline).
        if order.listing_id:
            order.due_at = timezone.now() + timedelta(days=order.listing.turnaround_days)
    order.save(update_fields=["payment_status", "status", "due_at", "updated_at"])
    record_event(order, OrderEvent.Type.PAID, actor=order.doctor, amount=str(order.amount))
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


def _charge_for(order: Order) -> str:
    """The charge backing this order's payment (cached on the order).

    Tying the payout transfer to its source charge lets it draw from those funds
    even before they settle to the platform's available balance (separate
    charges & transfers: the platform's available balance is often still 0 while
    the charge is pending).
    """
    if order.stripe_charge_id:
        return order.stripe_charge_id
    if not order.stripe_payment_intent_id:
        return ""
    intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
    charge_id = intent.latest_charge or ""
    if charge_id:
        order.stripe_charge_id = charge_id
        order.save(update_fields=["stripe_charge_id", "updated_at"])
    return charge_id


def release_payment(order: Order) -> bool:
    """Transfer amount − commission to the writer. Guarded by held status."""
    if order.payment_status != Order.PaymentStatus.HELD:
        return False
    if not order.writer.stripe_account_id:
        # Writer never onboarded; leave funds held until they do (rare in v1).
        logger.warning("Order %s completed but writer has no connected account", order.id)
        return False
    fee = platform_fee(order.amount)
    transfer_args = {
        "amount": _to_cents(order.amount - fee),
        "currency": order.currency.lower(),
        "destination": order.writer.stripe_account_id,
        "transfer_group": f"order_{order.id}",
        "metadata": {"order_id": order.id},
        "idempotency_key": f"order-{order.id}-transfer",
    }
    charge_id = _charge_for(order)
    if charge_id:
        transfer_args["source_transaction"] = charge_id
    try:
        transfer = stripe.Transfer.create(**transfer_args)
    except stripe.StripeError as exc:
        # Most commonly the writer's account isn't payout-ready yet (onboarding
        # not finished -> no "transfers" capability). Don't fail the completion:
        # the work is delivered and accepted. Leave the funds held so the payout
        # can be retried once onboarding completes (see release_pending_for_writer).
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
    record_event(order, OrderEvent.Type.RELEASED, amount=str(order.amount - fee))
    return True


def release_pending_for_writer(user) -> int:
    """Release funds held on the writer's already-completed orders.

    Handles the writer onboarding *after* an order was completed (so the payout
    couldn't run at completion time). Safe to call repeatedly: release_payment is
    guarded by held status and idempotent. Returns the number released.
    """
    if not (user.stripe_account_id and user.stripe_payouts_enabled):
        return 0
    held = Order.objects.filter(
        writer=user,
        status=Order.Status.COMPLETED,
        payment_status=Order.PaymentStatus.HELD,
    )
    return sum(1 for order in held if release_payment(order))


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
    record_event(order, OrderEvent.Type.REFUNDED, amount=str(order.amount))
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

    elif etype == "charge.dispute.created":
        _flag_dispute(obj)

    elif etype == "account.updated":
        user = User.objects.filter(stripe_account_id=_field(obj, "id")).first()
        if user:
            user.stripe_charges_enabled = bool(_field(obj, "charges_enabled"))
            user.stripe_payouts_enabled = bool(_field(obj, "payouts_enabled"))
            user.save(update_fields=["stripe_charges_enabled", "stripe_payouts_enabled"])
            if user.stripe_payouts_enabled:
                release_pending_for_writer(user)


def _flag_dispute(obj) -> None:
    """A chargeback was opened (charge.dispute.created): flag the order so it
    surfaces to admins. Resolve the order via its charge, else its intent."""
    from django.utils import timezone

    charge_id = _field(obj, "charge")
    order = Order.objects.filter(stripe_charge_id=charge_id).first() if charge_id else None
    if order is None:
        intent_id = _field(obj, "payment_intent")
        if intent_id:
            order = Order.objects.filter(stripe_payment_intent_id=intent_id).first()
    if order and order.disputed_at is None:
        order.disputed_at = timezone.now()
        order.save(update_fields=["disputed_at", "updated_at"])
        logger.warning("Dispute opened on order %s (charge %s)", order.id, charge_id)
