import pytest
from django.urls import reverse

from apps.common.choices import Specialty
from apps.listings.tests.factories import ListingFactory

pytestmark = pytest.mark.django_db


def test_public_writer_profile_lists_published_listings_and_specialties(
    api_client, writer_user
):
    ListingFactory(writer=writer_user, specialty=Specialty.CARDIOLOGY, is_published=True)
    ListingFactory(writer=writer_user, specialty=Specialty.ONCOLOGY, is_published=True)
    ListingFactory(writer=writer_user, specialty=Specialty.NEUROLOGY, is_published=False)

    # Public: no authentication.
    response = api_client.get(reverse("public-writer", args=[writer_user.id]))
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == writer_user.id
    assert body["is_verified"] is False
    assert len(body["listings"]) == 2  # only published
    assert set(body["specialties"]) == {Specialty.CARDIOLOGY, Specialty.ONCOLOGY}
    assert body["reviews_count"] == 0  # placeholder until reviews land


def test_public_profile_404_for_non_writer(api_client, user):
    response = api_client.get(reverse("public-writer", args=[user.id]))
    assert response.status_code == 404


def test_verified_badge_exposed(api_client, writer_user):
    writer_user.is_verified = True
    writer_user.save(update_fields=["is_verified"])
    response = api_client.get(reverse("public-writer", args=[writer_user.id]))
    assert response.json()["is_verified"] is True
