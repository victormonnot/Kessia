import pytest
from rest_framework.test import APIClient

from apps.favorites.models import Favorite
from apps.listings.models import Listing
from apps.users.models import User


@pytest.fixture
def writer(db):
    return User.objects.create_user(email="w@kessia.test", password="x", is_writer=True)


@pytest.fixture
def doctor(db):
    return User.objects.create_user(email="d@kessia.test", password="x")


@pytest.fixture
def listing(writer):
    return Listing.objects.create(
        writer=writer,
        title="Article",
        description="…",
        specialty="cardiologie",
        deliverable_type="research_paper",
        price="100.00",
        turnaround_days=5,
    )


@pytest.fixture
def client(doctor):
    c = APIClient()
    c.force_authenticate(doctor)
    return c


def test_toggle_adds_then_removes(client, doctor, listing):
    r = client.post("/api/v1/favorites/toggle/", {"listing": listing.id})
    assert r.status_code == 201 and r.data["favorited"] is True
    assert Favorite.objects.filter(user=doctor, listing=listing).exists()

    r = client.post("/api/v1/favorites/toggle/", {"listing": listing.id})
    assert r.status_code == 200 and r.data["favorited"] is False
    assert not Favorite.objects.filter(user=doctor, listing=listing).exists()


def test_toggle_requires_exactly_one_target(client, listing):
    r = client.post("/api/v1/favorites/toggle/", {})
    assert r.status_code == 400


def test_my_favorites_lists_saved_listing(client, doctor, listing):
    Favorite.objects.create(user=doctor, listing=listing)
    r = client.get("/api/v1/favorites/")
    assert r.status_code == 200
    ids = [item["id"] for item in r.data["listings"]]
    assert listing.id in ids


def test_listing_is_favorited_flag(client, doctor, listing):
    Favorite.objects.create(user=doctor, listing=listing)
    r = client.get(f"/api/v1/listings/{listing.id}/")
    assert r.data["is_favorited"] is True


def test_favorites_require_auth():
    r = APIClient().get("/api/v1/favorites/")
    assert r.status_code in (401, 403)
