from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order
from .permissions import IsOrderParticipant, IsOrderWriter
from .serializers import (
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderUpdateSerializer,
)


class OrderViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    filterset_fields = ("status",)
    ordering_fields = ("created_at",)
    ordering = ("-created_at",)
    http_method_names = ("get", "post", "patch", "head", "options")

    def get_queryset(self):
        user = self.request.user
        return Order.objects.select_related(
            "listing", "listing__writer", "doctor", "writer", "proposal"
        ).filter(Q(doctor=user) | Q(writer=user))

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action in {"update", "partial_update"}:
            return OrderUpdateSerializer
        return OrderDetailSerializer

    def get_permissions(self):
        if self.action in {"update", "partial_update"}:
            return [IsAuthenticated(), IsOrderWriter()]
        if self.action == "retrieve":
            return [IsAuthenticated(), IsOrderParticipant()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        create_serializer = self.get_serializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        order = create_serializer.save()
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        update_serializer = self.get_serializer(instance, data=request.data, partial=partial)
        update_serializer.is_valid(raise_exception=True)
        update_serializer.save()
        instance.refresh_from_db()
        return Response(OrderDetailSerializer(instance).data)
