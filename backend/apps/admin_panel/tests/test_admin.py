from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from django.urls import reverse

from apps.admin_panel.models import AuditLog
from apps.listings.tests.factories import ListingFactory
from apps.orders.models import Order
from apps.orders.tests.factories import OrderFactory
from apps.requests_board.models import Request
from apps.reviews.models import Review
from apps.users.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="owner@kessia.demo",
        password="adminpass123",
        is_staff=True,
        is_superuser=True,
        is_email_verified=True,
    )


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


# --- Access control ------------------------------------------------------
def test_non_admin_forbidden(auth_client):
    assert auth_client.get(reverse("admin-stats")).status_code == 403


def test_anonymous_forbidden(api_client):
    assert api_client.get(reverse("admin-stats")).status_code == 401


def test_admin_stats_ok(admin_client):
    resp = admin_client.get(reverse("admin-stats"))
    assert resp.status_code == 200
    assert "users_total" in resp.json()


# --- User moderation -----------------------------------------------------
def test_verify_unverify(admin_client, writer_user):
    admin_client.post(reverse("admin-user-verify", args=[writer_user.id]))
    writer_user.refresh_from_db()
    assert writer_user.is_verified is True
    admin_client.post(reverse("admin-user-unverify", args=[writer_user.id]))
    writer_user.refresh_from_db()
    assert writer_user.is_verified is False


def test_admin_delete_user(admin_client, writer_user):
    assert admin_client.post(reverse("admin-user-delete", args=[writer_user.id])).status_code == 200
    writer_user.refresh_from_db()
    assert writer_user.deleted_at is not None
    assert writer_user.email == f"deleted-{writer_user.pk}@kessia.invalid"


def test_admin_delete_blocked_while_active_order(admin_client, user, writer_user):
    OrderFactory(
        doctor=user, writer=writer_user, status=Order.Status.IN_PROGRESS,
        payment_status=Order.PaymentStatus.HELD,
    )
    resp = admin_client.post(reverse("admin-user-delete", args=[writer_user.id]))
    assert resp.status_code == 409
    writer_user.refresh_from_db()
    assert writer_user.deleted_at is None


def test_deleted_user_hidden_from_admin_list(admin_client, writer_user):
    admin_client.post(reverse("admin-user-delete", args=[writer_user.id]))
    listed = admin_client.get(reverse("admin-users"))
    assert writer_user.id not in [u["id"] for u in listed.json()["results"]]


def test_moderation_action_is_audit_logged(admin_client, writer_user):
    admin_client.post(reverse("admin-user-verify", args=[writer_user.id]))
    assert AuditLog.objects.filter(action="user.verify", target_id=str(writer_user.id)).exists()


# --- Content moderation --------------------------------------------------
def test_listing_remove_hides_from_public_then_restore(admin_client, api_client, writer_user):
    listing = ListingFactory(writer=writer_user, is_published=True)
    assert api_client.get(reverse("listing-list")).json()["count"] == 1

    assert admin_client.post(reverse("admin-listing-remove", args=[listing.id])).status_code == 200
    listing.refresh_from_db()
    assert listing.removed_at is not None
    assert api_client.get(reverse("listing-list")).json()["count"] == 0
    assert api_client.get(reverse("listing-detail", args=[listing.id])).status_code == 404

    admin_client.post(reverse("admin-listing-restore", args=[listing.id]))
    listing.refresh_from_db()
    assert listing.removed_at is None


def test_review_remove_excludes_from_public_list(admin_client, api_client, user, writer_user):
    listing = ListingFactory(writer=writer_user)
    order = OrderFactory(
        listing=listing, doctor=user, writer=writer_user, status=Order.Status.COMPLETED
    )
    review = Review.objects.create(order=order, doctor=user, writer=writer_user, rating=5)
    assert api_client.get(reverse("review-list"), {"writer": writer_user.id}).json()["count"] == 1

    admin_client.post(reverse("admin-review-remove", args=[review.id]))
    review.refresh_from_db()
    assert review.removed_at is not None
    assert api_client.get(reverse("review-list"), {"writer": writer_user.id}).json()["count"] == 0


def test_request_remove(admin_client, user):
    req = Request.objects.create(
        doctor=user, title="t", description="d", specialty="autres",
        deadline=date(2027, 1, 1), budget=Decimal("100.00"),
    )
    assert admin_client.post(reverse("admin-request-remove", args=[req.id])).status_code == 200
    req.refresh_from_db()
    assert req.removed_at is not None


# --- Orders & disputes ---------------------------------------------------
def test_order_refund(admin_client, user, writer_user):
    order = OrderFactory(
        doctor=user, writer=writer_user, status=Order.Status.IN_PROGRESS,
        payment_status=Order.PaymentStatus.HELD, stripe_payment_intent_id="pi_1",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Refund.create.return_value = MagicMock(id="re_1")
        resp = admin_client.post(reverse("admin-order-refund", args=[order.id]))
    assert resp.status_code == 200
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.REFUNDED


def test_order_release(admin_client, user, writer_user):
    writer_user.stripe_account_id = "acct_1"
    writer_user.save(update_fields=["stripe_account_id"])
    order = OrderFactory(
        doctor=user, writer=writer_user, status=Order.Status.DELIVERED,
        payment_status=Order.PaymentStatus.HELD, amount=Decimal("100.00"),
        stripe_payment_intent_id="pi_1", stripe_charge_id="ch_1",
    )
    with patch("apps.payments.services.stripe") as mock_stripe:
        mock_stripe.Transfer.create.return_value = MagicMock(id="tr_1")
        resp = admin_client.post(reverse("admin-order-release", args=[order.id]))
    assert resp.status_code == 200
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.RELEASED


def test_dispute_webhook_flags_order(user, writer_user):
    from apps.payments import services

    order = OrderFactory(
        doctor=user, writer=writer_user, payment_status=Order.PaymentStatus.HELD,
        stripe_payment_intent_id="pi_d", stripe_charge_id="ch_d",
    )
    event = {
        "id": "evt_dispute_1",
        "type": "charge.dispute.created",
        "data": {"object": {"charge": "ch_d", "payment_intent": "pi_d"}},
    }
    services.handle_webhook_event(event)
    order.refresh_from_db()
    assert order.disputed_at is not None


def test_admin_can_filter_disputed_orders(admin_client, user, writer_user):
    from django.utils import timezone

    OrderFactory(doctor=user, writer=writer_user)  # not disputed
    disputed = OrderFactory(doctor=user, writer=writer_user, disputed_at=timezone.now())
    resp = admin_client.get(reverse("admin-orders"), {"disputed": "true"})
    ids = [o["id"] for o in resp.json()["results"]]
    assert ids == [disputed.id]


# --- Reports -------------------------------------------------------------
def test_user_reports_and_admin_resolves(auth_client, admin_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    created = auth_client.post(
        reverse("report-create"),
        {"target_type": "listing", "target_id": listing.id, "reason": "spam"},
        format="json",
    )
    assert created.status_code == 201
    report_id = created.json()["id"]

    assert admin_client.get(reverse("admin-reports")).json()["count"] == 1
    resolved = admin_client.post(reverse("admin-report-resolve", args=[report_id]))
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"


def test_report_requires_auth(api_client, writer_user):
    listing = ListingFactory(writer=writer_user)
    resp = api_client.post(
        reverse("report-create"),
        {"target_type": "listing", "target_id": listing.id, "reason": "x"},
        format="json",
    )
    assert resp.status_code == 401


# --- Audit log -----------------------------------------------------------
def test_audit_log_lists_actions(admin_client, writer_user):
    admin_client.post(reverse("admin-user-verify", args=[writer_user.id]))
    resp = admin_client.get(reverse("admin-audit-log"))
    assert resp.status_code == 200
    assert resp.json()["count"] >= 1
