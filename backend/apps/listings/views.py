from django.db.models import Avg, Count, Exists, OuterRef, Q
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.common.permissions import IsEmailVerified

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
    # Removed reviews (admin takedown) must not count toward a writer's rating.
    _not_removed = Q(writer__reviews_received__removed_at__isnull=True)
    queryset = (
        Listing.objects.select_related("writer")
        .annotate(
            writer_rating=Avg("writer__reviews_received__rating", filter=_not_removed),
            writer_reviews_count=Count(
                "writer__reviews_received", distinct=True, filter=_not_removed
            ),
        )
        .all()
    )
    filterset_class = ListingFilter
    search_fields = ("title", "description")
    ordering_fields = ("created_at", "price", "turnaround_days", "writer_rating")
    ordering = ("-created_at",)

    def get_queryset(self):
        # Admin-removed listings are hidden from the public viewset entirely.
        qs = super().get_queryset().filter(removed_at__isnull=True)
        user = self.request.user
        # Unpublished listings are private drafts: only their author may see them.
        # Everyone else (anonymous or other users) sees published listings only.
        if user.is_authenticated:
            qs = qs.filter(Q(is_published=True) | Q(writer=user))

            from apps.favorites.models import Favorite

            qs = qs.annotate(
                is_favorited=Exists(
                    Favorite.objects.filter(user=user, listing=OuterRef("pk"))
                )
            )
        else:
            qs = qs.filter(is_published=True)
        return qs

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
            return [IsAuthenticated(), IsEmailVerified(), IsWriter()]
        # update / partial_update / destroy
        return [IsAuthenticated(), IsEmailVerified(), IsWriter(), IsListingOwner()]
