"""Request/proposal engagement logic.

Accepting a proposal turns it into an Order (the engagement), atomically and
under a row lock so two concurrent acceptances on the same request can't both
succeed.
"""

from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from apps.common.notifications import send_notification
from apps.orders.models import Order

from .models import Proposal, Request


@transaction.atomic
def accept_proposal(proposal: Proposal) -> Order:
    """Accept a proposal: create the order, close the request, reject the rest.

    Locks the request and its proposals (``select_for_update``) and re-checks
    state under the lock, so a concurrent acceptance fails cleanly rather than
    double-engaging the doctor.
    """
    request_obj = Request.objects.select_for_update().get(pk=proposal.request_id)
    locked_proposals = list(
        Proposal.objects.select_for_update().filter(request=request_obj)
    )
    target = next(p for p in locked_proposals if p.pk == proposal.pk)

    if request_obj.status != Request.Status.OPEN or target.status != Proposal.Status.PENDING:
        raise serializers.ValidationError("Cette demande n'accepte plus de propositions.")

    target.status = Proposal.Status.ACCEPTED
    target.save(update_fields=["status", "updated_at"])

    for other in locked_proposals:
        if other.pk != target.pk and other.status == Proposal.Status.PENDING:
            other.status = Proposal.Status.REJECTED
            other.save(update_fields=["status", "updated_at"])

    request_obj.status = Request.Status.CLOSED
    request_obj.save(update_fields=["status", "updated_at"])

    # The doctor accepting the proposal IS the agreement, so the engagement
    # starts already accepted and is ready for payment.
    return Order.objects.create(
        proposal=target,
        doctor=request_obj.doctor,
        writer=target.writer,
        amount=target.price,
        status=Order.Status.ACCEPTED,
        message=target.message,
    )


def notify_new_proposal(proposal: Proposal) -> None:
    send_notification("new_proposal", proposal.request.doctor.email, {"proposal": proposal})


def notify_proposal_accepted(proposal: Proposal) -> None:
    send_notification("proposal_accepted", proposal.writer.email, {"proposal": proposal})
