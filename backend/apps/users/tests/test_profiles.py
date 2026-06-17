import pytest
from django.urls import reverse

from apps.common.choices import Specialty
from apps.listings.tests.factories import ListingFactory
from apps.users.models import WriterPortfolioItem

pytestmark = pytest.mark.django_db


def test_public_writer_profile_lists_published_listings_and_specialties(
    api_client, writer_user
):
    ListingFactory(writer=writer_user, specialty=Specialty.CARDIOLOGIE, is_published=True)
    ListingFactory(writer=writer_user, specialty=Specialty.ONCOLOGIE, is_published=True)
    ListingFactory(writer=writer_user, specialty=Specialty.NEUROLOGIE, is_published=False)

    # Public: no authentication.
    response = api_client.get(reverse("public-writer", args=[writer_user.id]))
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == writer_user.id
    assert body["is_verified"] is False
    assert len(body["listings"]) == 2  # only published
    assert set(body["specialties"]) == {Specialty.CARDIOLOGIE, Specialty.ONCOLOGIE}
    assert body["reviews_count"] == 0  # placeholder until reviews land


def test_public_profile_404_for_non_writer(api_client, user):
    response = api_client.get(reverse("public-writer", args=[user.id]))
    assert response.status_code == 404


def test_verified_badge_exposed(api_client, writer_user):
    writer_user.is_verified = True
    writer_user.save(update_fields=["is_verified"])
    response = api_client.get(reverse("public-writer", args=[writer_user.id]))
    assert response.json()["is_verified"] is True


def test_portfolio_crud_owner_scoped(auth_client):
    create = auth_client.post(
        reverse("me-portfolio-list"),
        {"title": "Méta-analyse en cardiologie", "kind": "Revue", "summary": "PRISMA"},
        format="json",
    )
    assert create.status_code == 201
    item_id = create.json()["id"]

    listed = auth_client.get(reverse("me-portfolio-list")).json()
    results = listed.get("results", listed)
    assert len(results) == 1

    updated = auth_client.patch(
        reverse("me-portfolio-detail", args=[item_id]), {"title": "Modifié"}, format="json"
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Modifié"

    deleted = auth_client.delete(reverse("me-portfolio-detail", args=[item_id]))
    assert deleted.status_code == 204


def test_public_writer_profile_exposes_rich_fields(api_client, writer_user):
    WriterPortfolioItem.objects.create(user=writer_user, title="Cas clinique", kind="CARE")
    writer_user.languages = ["Français", "Anglais"]
    writer_user.response_time = "one_day"
    writer_user.save(update_fields=["languages", "response_time"])

    body = api_client.get(reverse("public-writer", args=[writer_user.id])).json()
    assert [p["title"] for p in body["portfolio"]] == ["Cas clinique"]
    assert body["languages"] == ["Français", "Anglais"]
    assert body["response_time"] == "one_day"
    assert body["completed_orders"] == 0
    assert body["rating_breakdown"] == {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
