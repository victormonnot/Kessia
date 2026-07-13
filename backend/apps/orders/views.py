import os
from datetime import timedelta
from decimal import Decimal

from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsEmailVerified

from .models import Order, OrderEvent
from .permissions import IsOrderParticipant
from .serializers import (
    DeliverableSerializer,
    DeliverableUploadSerializer,
    OrderAttachmentSerializer,
    OrderAttachmentUploadSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderUpdateSerializer,
)
from .services import notify_order_event, notify_status_change, record_event

# Status reached via a plain PATCH -> the activity-log event it should record.
# (Delivery and payment aren't PATCHes; they log their events at their own sites.)
_EVENT_FOR_PATCH_STATUS = {
    Order.Status.ACCEPTED: OrderEvent.Type.ACCEPTED,
    Order.Status.DECLINED: OrderEvent.Type.DECLINED,
    Order.Status.CANCELLED: OrderEvent.Type.CANCELLED,
    Order.Status.COMPLETED: OrderEvent.Type.COMPLETED,
}


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
        ).prefetch_related(
            "deliverables", "attachments__uploaded_by", "events__actor"
        )
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
        record_event(order, OrderEvent.Type.PLACED, actor=order.doctor)
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
        event_type = _EVENT_FOR_PATCH_STATUS.get(instance.status)
        if event_type:
            record_event(instance, event_type, actor=request.user)
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
        record_event(order, OrderEvent.Type.DELIVERED, actor=request.user)
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

    @action(
        detail=True,
        methods=("get", "post"),
        url_path="attachments",
        parser_classes=(MultiPartParser, FormParser),
    )
    def attachments(self, request, pk=None):
        """Brief/source documents shared on the order.

        GET lists them; POST lets either party add one while the order is live
        (closed orders are read-only). get_object() already restricts to the two
        parties, so non-participants 404 before reaching here.
        """
        order = self.get_object()

        if request.method == "GET":
            qs = order.attachments.all()
            return Response(OrderAttachmentSerializer(qs, many=True).data)

        if order.status in {
            Order.Status.COMPLETED,
            Order.Status.CANCELLED,
            Order.Status.DECLINED,
        }:
            return Response(
                {"detail": "Cette commande est clôturée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload = OrderAttachmentUploadSerializer(data=request.data)
        upload.is_valid(raise_exception=True)
        attachment = upload.save(order=order, uploaded_by=request.user)
        record_event(
            order,
            OrderEvent.Type.DOCUMENT_ADDED,
            actor=request.user,
            filename=os.path.basename(attachment.file.name),
        )

        return Response(
            OrderAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=("get",),
        url_path=r"attachments/(?P<attachment_id>[^/.]+)/download",
    )
    def download_attachment(self, request, pk=None, attachment_id=None):
        order = self.get_object()
        attachment = get_object_or_404(order.attachments, pk=attachment_id)
        return FileResponse(
            attachment.file.open("rb"),
            as_attachment=True,
            filename=os.path.basename(attachment.file.name),
        )

    @action(detail=True, methods=("get",), url_path="conversation")
    def conversation(self, request, pk=None):
        """The (deduped) conversation scoped to this order, created on first access.

        Lets the order workspace embed the chat without POSTing a "create" just to
        read it. Non-participants are filtered out by get_queryset (404 here).
        Lazy import avoids an app load-order cycle (messaging imports orders).
        """
        order = self.get_object()
        from apps.messaging.serializers import ConversationSerializer
        from apps.messaging.services import get_or_create_conversation

        conv = get_or_create_conversation(order.doctor, order.writer, order=order)
        return Response(
            ConversationSerializer(conv, context={"request": request}).data
        )

    @action(detail=True, methods=("post",), url_path="request-revision")
    def request_revision(self, request, pk=None):
        """The doctor sends a delivered order back for revision.

        Returns it to ``in_progress``, bumps the revision counter, pushes the
        deadline back by the listing turnaround, logs the event and notifies the
        writer. A dedicated action (not the status PATCH) keeps the transition
        machine simple.
        """
        order = self.get_object()
        if order.doctor_id != request.user.id:
            return Response(
                {"detail": "Seul le médecin peut demander une révision."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if order.status != Order.Status.DELIVERED:
            return Response(
                {"detail": "Vous ne pouvez demander une révision que sur une commande livrée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = (request.data.get("note") or "").strip()
        order.status = Order.Status.IN_PROGRESS
        order.revision_count += 1
        if order.listing_id:
            order.due_at = timezone.now() + timedelta(days=order.listing.turnaround_days)
        order.save(update_fields=["status", "revision_count", "due_at", "updated_at"])
        record_event(order, OrderEvent.Type.REVISION_REQUESTED, actor=request.user, note=note)
        notify_order_event(order, "order_revision_requested")

        return Response(OrderDetailSerializer(order).data)

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
