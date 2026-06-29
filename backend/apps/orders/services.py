"""Order lifecycle: the status machine and its notifications.

The transition map is the single source of truth for who can move an order to
which state. Delivery (``-> delivered``) is reachable only by uploading the
finished work (see the deliverables endpoint), never by a plain status PATCH.

Note: payment is wired in the payments app (Phase 4). There, the doctor pays
after acceptance and delivery becomes gated on the order being paid; release on
completion and refund on cancel-after-payment are handled there too.
"""

from __future__ import annotations

from .models import Order, OrderEvent

WRITER = "writer"
DOCTOR = "doctor"


def record_event(order: Order, event_type: str, actor=None, **metadata) -> OrderEvent:
    """Append an entry to the order's activity log (the workspace timeline)."""
    return OrderEvent.objects.create(
        order=order, type=event_type, actor=actor, metadata=metadata
    )

# from_status -> {to_status: actor allowed to perform the transition}
# `accepted -> in_progress` is system-driven (it happens when the doctor's
# payment is confirmed; see payments.services.mark_payment_held), so it is not
# an actor transition here. `-> delivered` is reached only by uploading the
# finished work (see the deliverables endpoint), never by a plain status PATCH.
ORDER_TRANSITIONS: dict[str, dict[str, str]] = {
    Order.Status.PENDING: {
        Order.Status.ACCEPTED: WRITER,
        Order.Status.DECLINED: WRITER,
        Order.Status.CANCELLED: DOCTOR,
    },
    Order.Status.ACCEPTED: {
        Order.Status.CANCELLED: DOCTOR,
    },
    Order.Status.IN_PROGRESS: {
        Order.Status.CANCELLED: DOCTOR,
    },
    Order.Status.DELIVERED: {
        Order.Status.COMPLETED: DOCTOR,
    },
}

# Status reached -> (event key, recipient resolver). IN_PROGRESS sends no email.
_EVENT_FOR_STATUS: dict[str, str] = {
    Order.Status.ACCEPTED: "order_accepted",
    Order.Status.DECLINED: "order_declined",
    Order.Status.DELIVERED: "order_delivered",
    Order.Status.COMPLETED: "order_completed",
    Order.Status.CANCELLED: "order_cancelled",
}

_RECIPIENT_FOR_EVENT = {
    "order_placed": lambda o: o.writer,
    "order_accepted": lambda o: o.doctor,
    "order_declined": lambda o: o.doctor,
    "order_delivered": lambda o: o.doctor,
    "order_completed": lambda o: o.writer,
    "order_cancelled": lambda o: o.writer,
}


def role_for(order: Order, user) -> str | None:
    """Return the user's role on this order, or None if they're not a party."""
    uid = getattr(user, "id", None)
    if uid == order.writer_id:
        return WRITER
    if uid == order.doctor_id:
        return DOCTOR
    return None


def can_transition(order: Order, new_status: str, role: str | None) -> bool:
    return ORDER_TRANSITIONS.get(order.status, {}).get(new_status) == role


def notify_order_event(order: Order, event: str) -> None:
    """Send the email tied to an order event to the appropriate party."""
    from apps.common.notifications import send_notification

    recipient = _RECIPIENT_FOR_EVENT[event](order)
    send_notification(event, recipient.email, {"order": order})


def notify_status_change(order: Order) -> None:
    """Send the email (if any) for the order's current status."""
    event = _EVENT_FOR_STATUS.get(order.status)
    if event:
        notify_order_event(order, event)
