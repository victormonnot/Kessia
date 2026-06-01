import pytest
from django.urls import reverse

from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.orders.tests.factories import OrderFactory
from apps.reviews.models import Review

pytestmark = pytest.mark.django_db


def _completed_order(doctor, writer):
    listing = ListingFactory(writer=writer)
    return OrderFactory(listing=listing, doctor=doctor, status=Order.Status.COMPLETED)


def test_doctor_can_review_completed_order(auth_client, user, writer_user):
    order = _completed_order(user, writer_user)
    response = auth_client.post(
        reverse("review-list"),
        {"order": order.id, "rating": 5, "comment": "Excellent"},
        format="json",
    )
    assert response.status_code == 201
    review = Review.objects.get(order=order)
    assert review.writer_id == writer_user.id
    assert review.doctor_id == user.id


def test_cannot_review_uncompleted_order(auth_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(listing=listing, doctor=user, status=Order.Status.DELIVERED)
    response = auth_client.post(
        reverse("review-list"),
        {"order": order.id, "rating": 4},
        format="json",
    )
    assert response.status_code == 400


def test_non_doctor_cannot_review(writer_auth_client, user, writer_user):
    # The order's doctor is `user`; the writer trying to review it is rejected.
    order = _completed_order(user, writer_user)
    response = writer_auth_client.post(
        reverse("review-list"),
        {"order": order.id, "rating": 4},
        format="json",
    )
    assert response.status_code == 400


def test_cannot_review_twice(auth_client, user, writer_user):
    order = _completed_order(user, writer_user)
    payload = {"order": order.id, "rating": 4}
    assert auth_client.post(reverse("review-list"), payload, format="json").status_code == 201
    assert auth_client.post(reverse("review-list"), payload, format="json").status_code == 400


def test_public_list_filtered_by_writer(api_client, user, writer_user):
    order = _completed_order(user, writer_user)
    Review.objects.create(order=order, doctor=user, writer=writer_user, rating=5)
    # No authentication required.
    response = api_client.get(reverse("review-list"), {"writer": writer_user.id})
    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_review_aggregates_on_writer_profile(auth_client, api_client, user, writer_user):
    order = _completed_order(user, writer_user)
    auth_client.post(
        reverse("review-list"),
        {"order": order.id, "rating": 4},
        format="json",
    )
    profile = api_client.get(reverse("public-writer", args=[writer_user.id])).json()
    assert profile["avg_rating"] == 4.0
    assert profile["reviews_count"] == 1


def test_review_aggregates_on_listing(auth_client, api_client, user, writer_user):
    order = _completed_order(user, writer_user)
    auth_client.post(
        reverse("review-list"),
        {"order": order.id, "rating": 4},
        format="json",
    )
    results = api_client.get(reverse("listing-list"), {"mine": "false"}).json()["results"]
    listing = next(r for r in results if r["writer"] == writer_user.id)
    assert listing["writer_rating"] == 4.0
    assert listing["writer_reviews_count"] == 1
