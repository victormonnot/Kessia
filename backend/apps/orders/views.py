import os
from decimal import Decimal

from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified

from .models import Order
from .permissions import IsOrderParticipant
from .serializers import (
    DeliverableSerializer,
    DeliverableUploadSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderUpdateSerializer,
)
from .services import notify_order_event, notify_status_change


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    filterset_fields = ("status", "payment_status")
    ordering_fields = ("created_at",)
    ordering = ("-created_at",)
    http_method_names = ("get", "post", "patch", "head", "options")

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related(
            "listing", "listing__writer", "doctor", "writer", "proposal", "review"
        ).prefetch_related("deliverables")
        # `?role=writer` (orders received) / `?role=doctor` (orders placed); both
        # otherwise. Used by the dashboards instead of client-side filtering.
        role = self.request.query_params.get("role")
        if role == "writer":
            return qs.filter(writer=user)
        if role == "doctor":
            return qs.filter(doctor=user)
        return qs.filter(Q(doctor=user) | Q(writer=user))

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action in {"update", "partial_update"}:
            return OrderUpdateSerializer
        return OrderDetailSerializer

    def get_permissions(self):
        # IsEmailVerified allows safe methods, so reads (retrieve, deliverables
        # GET, download, earnings) stay open; only writes (create, status PATCH,
        # deliverable upload) are gated.
        if self.action in {"update", "partial_update", "retrieve"}:
            return [IsAuthenticated(), IsEmailVerified(), IsOrderParticipant()]
        return [IsAuthenticated(), IsEmailVerified()]

    def create(self, request, *args, **kwargs):
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        order = create_serializer.save()
        notify_order_event(order, "order_placed")
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        update_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()
        instance.refresh_from_db()
        notify_status_change(instance)
        # Move money on terminal transitions (release on completed, refund on
        # declined/cancelled-after-payment). Guarded by payment_status, so it's
        # a no-op for unpaid orders. Lazy import avoids an app load-order cycle.
        from apps.payments.services import on_order_status_changed

        on_order_status_changed(instance)
        return Response(OrderDetailSerializer(instance).data)

    @action(
        detail=True,
        methods=("get", "post"),
        url_path="deliverables",
        parser_classes=(MultiPartParser, FormParser),
    )
    def deliverables(self, request, pk=None):
        order = self.get_object()

        if request.method == "GET":
            qs = order.deliverables.all()
            return Response(DeliverableSerializer(qs, many=True).data)

        # POST: only the writer delivers, and only once the order is paid and in
        # progress (payment moves accepted -> in_progress).
        if order.writer_id != request.user.id:
            return Response(
                {"detail": "Seul le rédacteur peut livrer le travail."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if order.status != Order.Status.IN_PROGRESS:
            return Response(
                {"detail": "Vous ne pouvez livrer qu'une commande payée et en cours."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload = DeliverableUploadSerializer(data=request.data)
        upload.is_valid(raise_exception=True)
        deliverable = upload.save(order=order)

        order.status = Order.Status.DELIVERED
        order.save(update_fields=["status", "updated_at"])
        notify_status_change(order)

        return Response(
            DeliverableSerializer(deliverable).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=("get",),
        url_path=r"deliverables/(?P<deliverable_id>[^/.]+)/download",
    )
    def download_deliverable(self, request, pk=None, deliverable_id=None):
        order = self.get_object()
        deliverable = get_object_or_404(order.deliverables, pk=deliverable_id)

        # The doctor can only download once the work has been delivered; the
        # writer (who uploaded it) may always retrieve their own file.
        is_doctor = request.user.id == order.doctor_id
        if is_doctor and order.status not in {Order.Status.DELIVERED, Order.Status.COMPLETED}:
            return Response(
                {"detail": "Le livrable n'est pas encore disponible."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return FileResponse(
            deliverable.file.open("rb"),
            as_attachment=True,
            filename=os.path.basename(deliverable.file.name),
        )

    @action(detail=False, methods=("get",))
    def earnings(self, request):
        """Writer earnings summary: funds in escrow and net amount earned."""
        received = Order.objects.filter(writer=request.user)
        held = received.filter(payment_status=Order.PaymentStatus.HELD)
        released = received.filter(payment_status=Order.PaymentStatus.RELEASED)

        in_escrow = sum((o.amount for o in held), Decimal("0"))
        earned = sum(
            (o.amount - (o.application_fee_amount or Decimal("0")) for o in released),
            Decimal("0"),
        )
        return Response(
            {
                "in_escrow": str(in_escrow),
                "earned": str(earned),
                "currency": "EUR",
                "held_count": held.count(),
                "released_count": released.count(),
            }
        )
