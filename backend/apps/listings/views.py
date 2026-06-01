from django.db.models import Avg, Count
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from .filters import ListingFilter
from .models import Listing
from .permissions import IsListingOwner, IsWriter
from .serializers import (
    ListingDetailSerializer,
    ListingListSerializer,
    ListingWriteSerializer,
)


class ListingViewSet(viewsets.ModelViewSet):
    # Annotate each listing with its writer's aggregate rating (avoids N+1 in
    # the catalog and on the detail view).
    queryset = (
        Listing.objects.select_related("writer")
        .annotate(
            writer_rating=Avg("writer__reviews_received__rating"),
            writer_reviews_count=Count("writer__reviews_received", distinct=True),
        )
        .all()
    )
    filterset_class = ListingFilter
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "price", "turnaround_days")
    ordering = ("-created_at",)

    def get_serializer_class(self):
        if self.action == "list":
            return ListingListSerializer
        if self.action in {"create", "update", "partial_update"}:
            return ListingWriteSerializer
        return ListingDetailSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated(), IsWriter()]
        # update / partial_update / destroy
        return [IsAuthenticated(), IsWriter(), IsListingOwner()]
