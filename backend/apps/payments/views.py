import stripe
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified
from apps.orders.models import Order

from . import services
from .models import StripeEvent


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmailVerified])
def connect_onboard(request):
    if not request.user.is_writer:
        return Response({"detail": "Réservé aux rédacteurs."}, status=status.HTTP_403_FORBIDDEN)
    url = services.create_onboarding_link(request.user)
    return Response({"url": url})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmailVerified])
def connect_session(request):
    """Client secret for the embedded onboarding component (no redirect)."""
    if not request.user.is_writer:
        return Response({"detail": "Réservé aux rédacteurs."}, status=status.HTTP_403_FORBIDDEN)
    client_secret = services.create_account_session(request.user)
    return Response(
        {
            "client_secret": client_secret,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def connect_status(request):
    user = request.user
    if user.stripe_account_id:
        try:
            services.refresh_account_status(user)
        except Exception:  # pragma: no cover - network/credentials issues in dev
            pass
    return Response(
        {
            "has_account": bool(user.stripe_account_id),
            "charges_enabled": user.stripe_charges_enabled,
            "payouts_enabled": user.stripe_payouts_enabled,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmailVerified])
def pay_order(request, order_id):
    order = get_object_or_404(Order, pk=order_id)
    if order.doctor_id != request.user.id:
        return Response({"detail": "Seul le médecin peut payer."}, status=status.HTTP_403_FORBIDDEN)
    if order.status != Order.Status.ACCEPTED:
        return Response(
            {"detail": "Le paiement n'est possible qu'une fois la commande acceptée."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if order.payment_status in {Order.PaymentStatus.HELD, Order.PaymentStatus.RELEASED}:
        return Response(
            {"detail": "Cette commande est déjà payée."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    intent = services.create_payment_intent(order)
    return Response(
        {
            "client_secret": intent.client_secret,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsEmailVerified])
def confirm_payment(request, order_id):
    """Sync the order with Stripe after the client confirms a payment.

    Webhooks are the source of truth, but this lets the flow complete in dev
    without the Stripe CLI. It is idempotent (mark_payment_held no-ops if held).
    """
    order = get_object_or_404(Order, pk=order_id)
    if order.doctor_id != request.user.id:
        return Response(status=status.HTTP_403_FORBIDDEN)
    if not order.stripe_payment_intent_id:
        return Response({"detail": "Aucun paiement en cours."}, status=status.HTTP_400_BAD_REQUEST)
    intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
    if intent.status == "succeeded":
        services.mark_payment_held(order)
    elif intent.status == "processing":
        # Slow method (e.g. SEPA): payment submitted, awaiting clearing.
        services.mark_payment_processing(order)
    order.refresh_from_db()
    return Response({"payment_status": order.payment_status, "status": order.status})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    signature = request.META.get("HTTP_STRIPE_SIGNATURE")
    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    # Record-and-process atomically. The event row is the idempotency guard
    # (skip replays), but it must only persist if handling succeeds: if the
    # handler raises, the atomic block rolls the row back so the 500 we return
    # makes Stripe retry — instead of the retry being skipped as a duplicate.
    with transaction.atomic():
        _, created = StripeEvent.objects.get_or_create(
            event_id=event["id"],
            defaults={"type": event["type"]},
        )
        if created:
            services.handle_webhook_event(event)
    return Response(status=status.HTTP_200_OK)
