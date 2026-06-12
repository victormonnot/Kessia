import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from apps.verification import services
from apps.verification.models import VerificationRequest

pytestmark = pytest.mark.django_db


def test_writer_can_submit_verification_request(writer_auth_client, writer_user):
    response = writer_auth_client.post(
        reverse("verification-list"),
        {"credentials": "MD, 8 ans d'expérience en rédaction médicale"},
        format="json",
    )
    assert response.status_code == 201
    assert VerificationRequest.objects.filter(writer=writer_user).count() == 1


def test_verification_document_rejects_disallowed_type(writer_auth_client):
    response = writer_auth_client.post(
        reverse("verification-list"),
        {
            "credentials": "MD",
            "document": SimpleUploadedFile("diplome.exe", b"MZ"),
        },
        format="multipart",
    )
    assert response.status_code == 400
    assert VerificationRequest.objects.count() == 0


def test_verification_document_rejects_oversized_file(writer_auth_client):
    too_big = SimpleUploadedFile("diplome.pdf", b"x" * (10 * 1024 * 1024 + 1))
    response = writer_auth_client.post(
        reverse("verification-list"),
        {"credentials": "MD", "document": too_big},
        format="multipart",
    )
    assert response.status_code == 400
    assert VerificationRequest.objects.count() == 0


def test_non_writer_cannot_submit(auth_client):
    response = auth_client.post(
        reverse("verification-list"),
        {"credentials": "..."},
        format="json",
    )
    assert response.status_code == 403


def test_cannot_submit_when_pending(writer_auth_client, writer_user):
    VerificationRequest.objects.create(writer=writer_user, credentials="x")
    response = writer_auth_client.post(
        reverse("verification-list"),
        {"credentials": "again"},
        format="json",
    )
    assert response.status_code == 400


def test_cannot_submit_when_already_verified(writer_auth_client, writer_user):
    writer_user.is_verified = True
    writer_user.save(update_fields=["is_verified"])
    response = writer_auth_client.post(
        reverse("verification-list"),
        {"credentials": "x"},
        format="json",
    )
    assert response.status_code == 400


def test_writer_lists_own_requests_only(writer_auth_client, writer_user, other_writer_user):
    VerificationRequest.objects.create(writer=writer_user, credentials="mine")
    VerificationRequest.objects.create(writer=other_writer_user, credentials="theirs")
    response = writer_auth_client.get(reverse("verification-list"))
    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_approve_sets_is_verified(writer_user, user):
    vr = VerificationRequest.objects.create(writer=writer_user, credentials="x")
    services.approve(vr, reviewer=user)
    vr.refresh_from_db()
    writer_user.refresh_from_db()
    assert vr.status == VerificationRequest.Status.APPROVED
    assert vr.reviewed_by_id == user.id
    assert writer_user.is_verified is True


def test_reject_does_not_verify(writer_user, user):
    vr = VerificationRequest.objects.create(writer=writer_user, credentials="x")
    services.reject(vr, reviewer=user)
    vr.refresh_from_db()
    writer_user.refresh_from_db()
    assert vr.status == VerificationRequest.Status.REJECTED
    assert writer_user.is_verified is False


def test_listing_exposes_writer_verified(api_client, writer_user):
    from apps.listings.tests.factories import ListingFactory

    writer_user.is_verified = True
    writer_user.save(update_fields=["is_verified"])
    listing = ListingFactory(writer=writer_user)
    response = api_client.get(reverse("listing-detail", args=[listing.id]))
    assert response.status_code == 200
    assert response.json()["writer_is_verified"] is True
