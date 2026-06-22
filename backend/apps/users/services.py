"""Account deletion = RGPD right to erasure, by anonymisation.

We never hard-delete a user: that would cascade away the *other* party's orders
and reviews (records they never agreed to lose) or be blocked outright by a
PROTECT constraint. Instead we anonymise in place — wipe every piece of personal
data and deactivate the account — while keeping the transactional rows, which we
are entitled (and often legally required) to retain (GDPR Art. 17(3)).

Erasure is honoured immediately when the user has no order in flight. If one is
still active, full erasure is *deferred*: we deactivate the account now (no
login, hidden from the marketplace, no new engagements) but keep the data the
live contract still needs, then finish the scrub automatically once that order
settles — see finalize_deletion_if_pending, called from the order-status hook.
"""

from __future__ import annotations

from django.db.models import Q
from django.utils import timezone


def has_active_engagements(user) -> bool:
    """True if the user has an order still in flight (work owed or money held).

    Anonymising mid-engagement would orphan escrowed funds (a payout needs the
    writer's Stripe account) or an undelivered order, so full erasure waits until
    such orders reach a terminal state.
    """
    from apps.orders.models import Order

    active_status = (
        Order.Status.PENDING,
        Order.Status.ACCEPTED,
        Order.Status.IN_PROGRESS,
        Order.Status.DELIVERED,
    )
    active_payment = (Order.PaymentStatus.HELD, Order.PaymentStatus.PROCESSING)
    return (
        Order.objects.filter(Q(doctor=user) | Q(writer=user))
        .filter(Q(status__in=active_status) | Q(payment_status__in=active_payment))
        .exists()
    )


def request_account_deletion(user) -> bool:
    """Honour an account-deletion request.

    Returns True if the account was fully anonymised immediately, or False if
    erasure is *deferred* because an order is still in flight (the account is
    deactivated now and finalised when that order settles).
    """
    user.deletion_requested_at = timezone.now()
    if has_active_engagements(user):
        _begin_pending_deletion(user)
        return False
    anonymize_account(user)
    return True


def finalize_deletion_if_pending(user) -> bool:
    """Complete a deferred erasure once the user has no active order left.

    Called after an order reaches a terminal state. No-ops unless the user asked
    to delete, hasn't been scrubbed yet, and has nothing else in flight.
    """
    if (
        user.deletion_requested_at
        and user.deleted_at is None
        and not has_active_engagements(user)
    ):
        anonymize_account(user)
        return True
    return False


def _begin_pending_deletion(user) -> None:
    """Deactivate the account and stop new engagements, but keep the data the
    live order still needs (names, email, Stripe) until it settles."""
    from apps.requests_board.models import Proposal, Request

    user.is_active = False
    user.listings.update(is_published=False)
    user.requests_posted.filter(status=Request.Status.OPEN).update(status=Request.Status.CLOSED)
    user.proposals_sent.filter(status=Proposal.Status.PENDING).update(
        status=Proposal.Status.REJECTED
    )
    user.set_unusable_password()
    user.save(update_fields=["is_active", "password", "deletion_requested_at"])


def anonymize_account(user) -> None:
    """Scrub all personal data from the account and deactivate it, in place.

    Transactional records (orders, reviews, messages) are kept but now point to
    an anonymous, deactivated user. The counterparty's data is left untouched.
    """
    from apps.requests_board.models import Proposal, Request

    # Personal/professional profile content lives in child rows — remove them.
    user.experiences.all().delete()
    user.publications.all().delete()
    user.portfolio.all().delete()

    # Their listings can't be deleted (orders PROTECT them) — unpublish so the
    # marketplace stops showing a deleted user's services.
    user.listings.update(is_published=False)

    # Close still-open requests and withdraw pending proposals so nobody engages
    # a ghost account after the fact.
    user.requests_posted.filter(status=Request.Status.OPEN).update(status=Request.Status.CLOSED)
    user.proposals_sent.filter(status=Proposal.Status.PENDING).update(
        status=Proposal.Status.REJECTED
    )

    # Drop the avatar file from storage.
    if user.avatar:
        user.avatar.delete(save=False)

    # Wipe PII. Email becomes a non-reversible placeholder (true anonymisation,
    # not pseudonymisation): nothing here can be traced back to the person.
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

    # Detach Stripe (per-order Stripe references stay on the Order rows for payout
    # accounting; the link to the writer's connected account is severed).
    user.stripe_account_id = ""
    user.stripe_charges_enabled = False
    user.stripe_payouts_enabled = False

    # Deactivate and mark deleted. is_active=False alone blocks both REST
    # (SimpleJWT rejects inactive users) and WebSocket auth.
    user.is_active = False
    user.is_writer = False
    user.is_verified = False
    user.is_email_verified = False
    user.deleted_at = timezone.now()
    user.set_unusable_password()
    user.save()
