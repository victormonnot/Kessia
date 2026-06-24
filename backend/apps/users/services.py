"""Account deletion = RGPD right to erasure, by anonymisation.

We never hard-delete a user: that would cascade away the *other* party's orders
and reviews (records they never agreed to lose) or be blocked outright by a
PROTECT constraint. Instead we anonymise in place — wipe every piece of personal
data and deactivate the account — while keeping the transactional rows, which we
are entitled (and often legally required) to retain (GDPR Art. 17(3)). Keeping
the rows is also what lets reviews survive as authored by "Utilisateur supprimé".

Deletion is *refused* (not deferred) while the account has an order in flight or
funds still unsettled: the user must finish the order / let the funds settle
first. The caller surfaces the returned reason. The same guard applies when an
admin deletes a user.
"""

from __future__ import annotations

from django.db.models import Q
from django.utils import timezone


def deletion_block_reason(user) -> str | None:
    """A French explanation if the account can't be deleted yet, else ``None``."""
    from apps.orders.models import Order

    party = Q(doctor=user) | Q(writer=user)
    active_status = (
        Order.Status.PENDING,
        Order.Status.ACCEPTED,
        Order.Status.IN_PROGRESS,
        Order.Status.DELIVERED,
    )
    if Order.objects.filter(party, status__in=active_status).exists():
        return "Vous avez une commande en cours. Terminez-la avant de supprimer le compte."

    unsettled = (Order.PaymentStatus.HELD, Order.PaymentStatus.PROCESSING)
    if Order.objects.filter(party, payment_status__in=unsettled).exists():
        return (
            "Des fonds sont encore en cours de règlement. Attendez leur versement "
            "avant de supprimer le compte."
        )
    return None


def anonymize_account(user) -> None:
    """Scrub all personal data from the account and deactivate it, in place.

    Transactional records (orders, reviews, messages) are kept but now point to
    an anonymous, deactivated user. The counterparty's data is left untouched.
    """
    from apps.requests_board.models import Proposal, Request

    # Profile child rows hold personal/professional data — remove them.
    user.experiences.all().delete()
    user.publications.all().delete()
    user.portfolio.all().delete()

    # Listings: delete those with no orders; hide the rest (orders lock them via
    # PROTECT, and they back retained financial records).
    for listing in user.listings.all():
        if listing.orders.exists():
            listing.is_published = False
            listing.removed_at = timezone.now()
            listing.save(update_fields=["is_published", "removed_at", "updated_at"])
        else:
            listing.delete()

    # Close still-open requests and withdraw pending proposals.
    user.requests_posted.filter(status=Request.Status.OPEN).update(status=Request.Status.CLOSED)
    user.proposals_sent.filter(status=Proposal.Status.PENDING).update(
        status=Proposal.Status.REJECTED
    )

    if user.avatar:
        user.avatar.delete(save=False)

    # Wipe PII. Email becomes a non-reversible placeholder (true anonymisation).
    user.email = f"deleted-{user.pk}@kessia.invalid"
    user.first_name = ""
    user.last_name = ""
    user.bio = ""
    user.avatar = None
    user.headline = ""
    user.city = ""
    user.google_scholar_url = ""
    user.years_experience = None
    user.expertise_areas = []
    user.profile_sections = {}
    user.languages = []
    user.response_time = ""

    # Detach Stripe (per-order Stripe references stay on the Order rows).
    user.stripe_account_id = ""
    user.stripe_charges_enabled = False
    user.stripe_payouts_enabled = False

    # Deactivate and mark deleted. is_active=False blocks REST + WebSocket auth.
    user.is_active = False
    user.is_writer = False
    user.is_verified = False
    user.is_email_verified = False
    user.deleted_at = timezone.now()
    user.set_unusable_password()
    user.save()
