"""Lightweight transactional-email helper.

Adding a new notification is two steps: register a French subject line in
``NOTIFICATION_SUBJECTS`` and drop a matching template at
``apps/common/templates/emails/<event>.txt``. Callers pass a context dict that
the template renders. Email delivery uses the configured backend (console in
dev, locmem in tests, a real provider in prod) and never raises into the caller
so a notification failure can't break the underlying action.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# event key -> French subject line. The body lives in templates/emails/<event>.txt
NOTIFICATION_SUBJECTS: dict[str, str] = {
    "order_placed": "Nouvelle commande reçue sur Kessia",
    "order_accepted": "Votre commande a été acceptée",
    "order_declined": "Votre commande a été refusée",
    "order_delivered": "Votre commande a été livrée",
    "order_completed": "Votre commande a été finalisée",
    "order_cancelled": "Une commande a été annulée",
    "order_revision_requested": "Une révision a été demandée",
    "new_proposal": "Nouvelle proposition reçue sur Kessia",
    "proposal_accepted": "Votre proposition a été acceptée",
    "new_message": "Nouveau message sur Kessia",
    "password_reset": "Réinitialisation de votre mot de passe Kessia",
    "email_verification": "Confirmez votre adresse e-mail Kessia",
}


def send_notification(event: str, recipient_email: str, context: dict | None = None) -> None:
    """Render and send the email for ``event`` to ``recipient_email``."""
    subject = NOTIFICATION_SUBJECTS.get(event)
    if subject is None:
        logger.warning("Unknown notification event: %s", event)
        return

    context = {"frontend_url": settings.FRONTEND_URL, **(context or {})}
    body = render_to_string(f"emails/{event}.txt", context)

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
        )
    except Exception:  # pragma: no cover - resilience: never break the action
        logger.exception("Failed to send '%s' notification to %s", event, recipient_email)
