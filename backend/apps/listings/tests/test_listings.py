import pytest
from django.urls import reverse

from apps.common.choices import DeliverableType, Specialty
from apps.listings.models import Listing
from apps.listings.tests.factories import ListingFactory

pytestmark = pytest.mark.django_db


def _payload(**overrides):
    base = {
        "title": "Cardio review article",
        "description": "I will write your review article.",
        "specialty": Specialty.CARDIOLOGIE,
        "deliverable_type": DeliverableType.VULGARISATION,
        "price": "300.00",
        "turnaround_days": 10,
        "is_published": True,
    }
    base.update(overrides)
    return base


def test_writer_can_create_listing(writer_auth_client, writer_user):
    response = writer_auth_client.post(reverse("listing-list"), _payload(), format="json")
    assert response.status_code == 201
    assert Listing.objects.filter(writer=writer_user).count() == 1


def test_non_writer_cannot_create_listing(auth_client):
    response = auth_client.post(reverse("listing-list"), _payload(), format="json")
    assert response.status_code == 403


def test_public_can_list_listings(api_client):
    ListingFactory.create_batch(3)
    response = api_client.get(reverse("listing-list"))
    assert response.status_code == 200
    assert response.json()["count"] == 3


def test_writer_can_update_own_listing(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    response = writer_auth_client.patch(
        reverse("listing-detail", args=[listing.id]),
        {"title": "Updated title"},
        format="json",
    )
    assert response.status_code == 200
    listing.refresh_from_db()
    assert listing.title == "Updated title"


def test_writer_cannot_update_others_listing(other_writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    response = other_writer_auth_client.patch(
        reverse("listing-detail", args=[listing.id]),
        {"title": "Hijack"},
        format="json",
    )
    assert response.status_code == 403


def test_writer_can_delete_own_listing(writer_auth_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    response = writer_auth_client.delete(reverse("listing-detail", args=[listing.id]))
    assert response.status_code == 204
    assert not Listing.objects.filter(id=listing.id).exists()


def test_filter_by_specialty(api_client):
    ListingFactory(specialty=Specialty.CARDIOLOGIE)
    ListingFactory(specialty=Specialty.NEUROLOGIE)
    response = api_client.get(reverse("listing-list"), {"specialty": Specialty.NEUROLOGIE})
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 1
    assert results[0]["specialty"] == Specialty.NEUROLOGIE


def test_search_by_title(api_client):
    ListingFactory(title="Cardiology review")
    ListingFactory(title="Oncology paper")
    response = api_client.get(reverse("listing-list"), {"search": "oncology"})
    assert response.json()["count"] == 1


def test_mine_filter_returns_only_own_listings(writer_auth_client, writer_user, other_writer_user):
    ListingFactory(writer=writer_user)
    ListingFactory(writer=other_writer_user)
    response = writer_auth_client.get(reverse("listing-list"), {"mine": "true"})
    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_filter_by_price_range(api_client):
    from decimal import Decimal

    ListingFactory(price=Decimal("100.00"))
    ListingFactory(price=Decimal("500.00"))
    response = api_client.get(
        reverse("listing-list"), {"price_min": "200", "price_max": "600"}
    )
    assert response.json()["count"] == 1


def test_filter_by_turnaround_max(api_client):
    ListingFactory(turnaround_days=5)
    ListingFactory(turnaround_days=30)
    response = api_client.get(reverse("listing-list"), {"turnaround_max": "10"})
    assert response.json()["count"] == 1


def test_filter_by_min_rating(api_client, user, writer_user, other_writer_user):
    from apps.orders.models import Order
    from apps.orders.tests.factories import OrderFactory
    from apps.reviews.models import Review

    rated = ListingFactory(writer=writer_user)
    ListingFactory(writer=other_writer_user)  # no reviews -> rating NULL
    order = OrderFactory(listing=rated, doctor=user, status=Order.Status.COMPLETED)
    Review.objects.create(order=order, doctor=user, writer=writer_user, rating=5)

    response = api_client.get(reverse("listing-list"), {"rating_min": "4"})
    assert response.status_code == 200
    ids = [r["id"] for r in response.json()["results"]]
    assert ids == [rated.id]
