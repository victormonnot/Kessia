from datetime import date, timedelta

import pytest
from django.urls import reverse

from apps.common.choices import Specialty
from apps.requests_board.models import Proposal, Request
from apps.requests_board.tests.factories import ProposalFactory, RequestFactory

pytestmark = pytest.mark.django_db


def _request_payload(**overrides):
    base = {
        "title": "Need an oncology paper",
        "description": "Looking for help",
        "specialty": Specialty.ONCOLOGY,
        "deadline": (date.today() + timedelta(days=30)).isoformat(),
        "budget": "500.00",
    }
    base.update(overrides)
    return base


def test_authenticated_user_can_create_request(auth_client, user):
    response = auth_client.post(reverse("request-list"), _request_payload(), format="json")
    assert response.status_code == 201
    assert Request.objects.filter(doctor=user).count() == 1


def test_anonymous_can_list_requests(api_client):
    RequestFactory.create_batch(2)
    response = api_client.get(reverse("request-list"))
    assert response.status_code == 200
    assert response.json()["count"] == 2


def test_writer_can_submit_proposal(writer_auth_client, writer_user):
    req = RequestFactory()
    response = writer_auth_client.post(
        reverse("request-proposals", args=[req.id]),
        {"message": "I can help", "price": "400.00"},
        format="json",
    )
    assert response.status_code == 201
    assert Proposal.objects.filter(request=req, writer=writer_user).count() == 1


def test_non_writer_cannot_submit_proposal(auth_client):
    req = RequestFactory()
    response = auth_client.post(
        reverse("request-proposals", args=[req.id]),
        {"message": "I'm not a writer", "price": "300.00"},
        format="json",
    )
    assert response.status_code == 403


def test_duplicate_proposal_rejected(writer_auth_client, writer_user):
    req = RequestFactory()
    ProposalFactory(request=req, writer=writer_user)
    response = writer_auth_client.post(
        reverse("request-proposals", args=[req.id]),
        {"message": "Again", "price": "100.00"},
        format="json",
    )
    assert response.status_code == 400


def test_request_owner_sees_all_proposals(auth_client, user):
    req = RequestFactory(doctor=user)
    ProposalFactory.create_batch(3, request=req)
    response = auth_client.get(reverse("request-proposals", args=[req.id]))
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_writer_sees_only_own_proposal(writer_auth_client, writer_user):
    req = RequestFactory()
    ProposalFactory(request=req, writer=writer_user)
    ProposalFactory(request=req)  # someone else's
    response = writer_auth_client.get(reverse("request-proposals", args=[req.id]))
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["writer"]["id"] == writer_user.id


def test_owner_can_accept_proposal(auth_client, user):
    req = RequestFactory(doctor=user)
    proposal = ProposalFactory(request=req)
    response = auth_client.patch(
        reverse("proposal-detail", args=[proposal.id]),
        {"status": Proposal.Status.ACCEPTED},
        format="json",
    )
    assert response.status_code == 200
    proposal.refresh_from_db()
    assert proposal.status == Proposal.Status.ACCEPTED


def test_writer_cannot_accept_proposal(writer_auth_client, writer_user):
    proposal = ProposalFactory(writer=writer_user)
    response = writer_auth_client.patch(
        reverse("proposal-detail", args=[proposal.id]),
        {"status": Proposal.Status.ACCEPTED},
        format="json",
    )
    assert response.status_code == 403


def test_writer_can_withdraw_own_proposal(writer_auth_client, writer_user):
    proposal = ProposalFactory(writer=writer_user)
    response = writer_auth_client.delete(reverse("proposal-detail", args=[proposal.id]))
    assert response.status_code == 204
    assert not Proposal.objects.filter(id=proposal.id).exists()


def test_requests_mine_filter(auth_client, user):
    RequestFactory(doctor=user)
    RequestFactory()  # someone else's request
    response = auth_client.get(reverse("request-list"), {"mine": "true"})
    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_proposals_list_scopes_to_involved_users(user, writer_user):
    from rest_framework.test import APIClient

    doctor_client = APIClient()
    doctor_client.force_authenticate(user)
    writer_client = APIClient()
    writer_client.force_authenticate(writer_user)

    own_request = RequestFactory(doctor=user)
    ProposalFactory(request=own_request, writer=writer_user)
    ProposalFactory()  # unrelated proposal on someone else's request

    # The doctor sees the proposal on their own request.
    as_doctor = doctor_client.get(reverse("proposal-list"))
    assert as_doctor.status_code == 200
    assert as_doctor.json()["count"] == 1

    # The writer sees their own proposal.
    as_writer = writer_client.get(reverse("proposal-list"))
    assert as_writer.json()["count"] == 1
