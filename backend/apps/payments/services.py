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


def create_payment_intent(order: Order):
    """Create (or idempotently reuse) the PaymentIntent for an accepted order."""
    intent = stripe.PaymentIntent.create(
        amount=_to_cents(order.amount),
        currency=order.currency.lower(),
        metadata={"order_id": order.id},
        transfer_group=f"order_{order.id}",
        idempotency_key=f"order-{order.id}-pi",
    )
    order.stripe_payment_intent_id = intent.id
    order.payment_status = Order.PaymentStatus.PROCESSING
    order.save(update_fields=["stripe_payment_intent_id", "payment_status", "updated_at"])
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


def release_payment(order: Order) -> bool:
    """Transfer amount − commission to the writer. Guarded by held status."""
    if order.payment_status != Order.PaymentStatus.HELD:
        return False
    if not order.writer.stripe_account_id:
        # Writer never onboarded; leave funds held until they do (rare in v1).
        logger.warning("Order %s completed but writer has no connected account", order.id)
        return False
    fee = platform_fee(order.amount)
    transfer = stripe.Transfer.create(
        amount=_to_cents(order.amount - fee),
        currency=order.currency.lower(),
        destination=order.writer.stripe_account_id,
        transfer_group=f"order_{order.id}",
        metadata={"order_id": order.id},
        idempotency_key=f"order-{order.id}-transfer",
    )
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
        refund_payment(order)


# --- Webhook handling ----------------------------------------------------


def handle_webhook_event(event) -> None:
    etype = event["type"]
    obj = event["data"]["object"]

    if etype == "payment_intent.succeeded":
        order_id = (obj.get("metadata") or {}).get("order_id")
        if order_id:
            order = Order.objects.filter(pk=order_id).first()
            if order:
                mark_payment_held(order)

    elif etype == "account.updated":
        user = User.objects.filter(stripe_account_id=obj.get("id")).first()
        if user:
            user.stripe_charges_enabled = bool(obj.get("charges_enabled"))
            user.stripe_payouts_enabled = bool(obj.get("payouts_enabled"))
            user.save(update_fields=["stripe_charges_enabled", "stripe_payouts_enabled"])
