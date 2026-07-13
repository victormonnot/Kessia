from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.listings.models import Listing
from apps.orders.models import Order
from apps.requests_board.models import Request
from apps.reviews.models import Review
from apps.users.models import User
from apps.users.services import anonymize_account, deletion_block_reason
from apps.verification.models import VerificationRequest

from . import serializers as s
from .models import AuditLog, Report
from .services import log_action


# --- Dashboard -----------------------------------------------------------
@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats(request):
    users = User.objects.filter(deleted_at__isnull=True)
    orders = Order.objects.all()
    active = (Order.Status.PENDING, Order.Status.ACCEPTED, Order.Status.IN_PROGRESS,
              Order.Status.DELIVERED)
    return Response({
        "users_total": users.count(),
        "writers_total": users.filter(is_writer=True).count(),
        "verified_writers": users.filter(is_writer=True, is_verified=True).count(),
        "listings_total": Listing.objects.filter(removed_at__isnull=True).count(),
        "requests_open": Request.objects.filter(
            status=Request.Status.OPEN, removed_at__isnull=True
        ).count(),
        "orders_total": orders.count(),
        "orders_active": orders.filter(status__in=active).count(),
        "gmv": str(
            orders.exclude(payment_status=Order.PaymentStatus.REFUNDED)
            .aggregate(t=Sum("amount"))["t"] or 0
        ),
        "revenue": str(
            orders.filter(payment_status=Order.PaymentStatus.RELEASED)
            .aggregate(t=Sum("application_fee_amount"))["t"] or 0
        ),
        "in_escrow": str(
            orders.filter(payment_status=Order.PaymentStatus.HELD)
            .aggregate(t=Sum("amount"))["t"] or 0
        ),
        "pending_verifications": VerificationRequest.objects.filter(
            status=VerificationRequest.Status.PENDING
        ).count(),
        "open_disputes": orders.filter(disputed_at__isnull=False).count(),
        "open_reports": Report.objects.filter(status=Report.Status.OPEN).count(),
    })


# --- Users ---------------------------------------------------------------
class AdminUserList(generics.ListAPIView):
    serializer_class = s.AdminUserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        # Deleted (anonymised) accounts are gone from the list.
        qs = User.objects.filter(deleted_at__isnull=True).order_by("-date_joined")
        q = self.request.query_params.get("search")
        if q:
            qs = qs.filter(
                Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
            )
        role = self.request.query_params.get("role")
        if role == "writer":
            qs = qs.filter(is_writer=True)
        elif role == "doctor":
            qs = qs.filter(is_writer=False)
        return qs


class AdminUserDetail(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = s.AdminUserDetailSerializer
    permission_classes = [IsAdminUser]


@api_view(["POST"])
@permission_classes([IsAdminUser])
def user_verify(request, pk):
    user = get_object_or_404(User, pk=pk)
    user.is_verified = True
    user.save(update_fields=["is_verified"])
    log_action(request.user, "user.verify", "user", user.id)
    return Response(s.AdminUserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def user_unverify(request, pk):
    user = get_object_or_404(User, pk=pk)
    user.is_verified = False
    user.save(update_fields=["is_verified"])
    log_action(request.user, "user.unverify", "user", user.id)
    return Response(s.AdminUserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def user_delete(request, pk):
    """Delete a user's account (RGPD erasure: personal data anonymised in place,
    transactional records kept). Refused — same as a self-deletion — while the
    user has an order in flight or unsettled funds."""
    user = get_object_or_404(User, pk=pk)
    if user.id == request.user.id:
        return Response({"detail": "Utilisez la suppression de votre propre compte."}, status=400)
    if user.deleted_at is not None:
        return Response({"detail": "Compte déjà supprimé."}, status=400)
    reason = deletion_block_reason(user)
    if reason:
        return Response({"detail": reason}, status=409)
    anonymize_account(user)
    log_action(request.user, "user.delete", "user", user.id)
    return Response(s.AdminUserSerializer(user).data)


# --- Content moderation: shared remove/restore ---------------------------
def _set_removed(model, pk, removed, actor, action, extra_fields=None):
    obj = get_object_or_404(model, pk=pk)
    obj.removed_at = timezone.now() if removed else None
    fields = ["removed_at"] + (extra_fields or [])
    obj.save(update_fields=fields)
    log_action(actor, action, model.__name__.lower(), obj.id)
    return obj


class AdminListingList(generics.ListAPIView):
    serializer_class = s.AdminListingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Listing.objects.select_related("writer").order_by("-created_at")
        q = self.request.query_params.get("search")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(writer__email__icontains=q))
        return qs


@api_view(["POST"])
@permission_classes([IsAdminUser])
def listing_remove(request, pk):
    obj = get_object_or_404(Listing, pk=pk)
    obj.removed_at = timezone.now()
    obj.is_published = False
    obj.save(update_fields=["removed_at", "is_published", "updated_at"])
    log_action(request.user, "listing.remove", "listing", obj.id, reason=request.data.get("reason", ""))
    return Response(s.AdminListingSerializer(obj).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def listing_restore(request, pk):
    obj = _set_removed(Listing, pk, False, request.user, "listing.restore", ["updated_at"])
    return Response(s.AdminListingSerializer(obj).data)


class AdminRequestList(generics.ListAPIView):
    serializer_class = s.AdminRequestSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Request.objects.select_related("doctor").order_by("-created_at")
        q = self.request.query_params.get("search")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(doctor__email__icontains=q))
        return qs


@api_view(["POST"])
@permission_classes([IsAdminUser])
def request_remove(request, pk):
    obj = _set_removed(Request, pk, True, request.user, "request.remove", ["updated_at"])
    return Response(s.AdminRequestSerializer(obj).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def request_restore(request, pk):
    obj = _set_removed(Request, pk, False, request.user, "request.restore", ["updated_at"])
    return Response(s.AdminRequestSerializer(obj).data)


class AdminReviewList(generics.ListAPIView):
    serializer_class = s.AdminReviewSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Review.objects.select_related("writer", "doctor").order_by("-created_at")


@api_view(["POST"])
@permission_classes([IsAdminUser])
def review_remove(request, pk):
    obj = _set_removed(Review, pk, True, request.user, "review.remove")
    return Response(s.AdminReviewSerializer(obj).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def review_restore(request, pk):
    obj = _set_removed(Review, pk, False, request.user, "review.restore")
    return Response(s.AdminReviewSerializer(obj).data)


# --- Orders & disputes ---------------------------------------------------
class AdminOrderList(generics.ListAPIView):
    serializer_class = s.AdminOrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.select_related("doctor", "writer").order_by("-created_at")
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        ps = self.request.query_params.get("payment_status")
        if ps:
            qs = qs.filter(payment_status=ps)
        if self.request.query_params.get("disputed") == "true":
            qs = qs.filter(disputed_at__isnull=False)
        return qs


class AdminOrderDetail(generics.RetrieveAPIView):
    queryset = Order.objects.select_related("doctor", "writer").prefetch_related(
        "deliverables", "conversations__messages"
    )
    serializer_class = s.AdminOrderDetailSerializer
    permission_classes = [IsAdminUser]


@api_view(["POST"])
@permission_classes([IsAdminUser])
def order_refund(request, pk):
    from apps.payments.services import refund_payment

    order = get_object_or_404(Order, pk=pk)
    ok = refund_payment(order)
    log_action(request.user, "order.refund", "order", order.id, success=ok)
    if not ok:
        return Response({"detail": "Remboursement impossible (statut de paiement)."}, status=400)
    order.refresh_from_db()
    return Response(s.AdminOrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def order_release(request, pk):
    from apps.payments.services import release_payment

    order = get_object_or_404(Order, pk=pk)
    ok = release_payment(order)
    log_action(request.user, "order.release", "order", order.id, success=ok)
    if not ok:
        return Response({"detail": "Versement impossible (statut de paiement)."}, status=400)
    order.refresh_from_db()
    return Response(s.AdminOrderSerializer(order).data)


# --- Reports -------------------------------------------------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_create(request):
    serializer = s.ReportCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    report = serializer.save(reporter=request.user)
    return Response(s.ReportSerializer(report).data, status=201)


class AdminReportList(generics.ListAPIView):
    serializer_class = s.ReportSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Report.objects.select_related("reporter").order_by("-created_at")
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        return qs


def _close_report(request, pk, new_status, action):
    report = get_object_or_404(Report, pk=pk)
    report.status = new_status
    report.resolved_by = request.user
    report.resolved_at = timezone.now()
    report.save(update_fields=["status", "resolved_by", "resolved_at"])
    log_action(request.user, action, "report", report.id)
    return Response(s.ReportSerializer(report).data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def report_resolve(request, pk):
    return _close_report(request, pk, Report.Status.RESOLVED, "report.resolve")


@api_view(["POST"])
@permission_classes([IsAdminUser])
def report_dismiss(request, pk):
    return _close_report(request, pk, Report.Status.DISMISSED, "report.dismiss")


# --- Audit log -----------------------------------------------------------
class AdminAuditLogList(generics.ListAPIView):
    serializer_class = s.AuditLogSerializer
    permission_classes = [IsAdminUser]
    queryset = AuditLog.objects.select_related("actor").all()
