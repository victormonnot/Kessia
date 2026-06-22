from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.listings.models import Listing
from apps.listings.serializers import ListingListSerializer
from apps.requests_board.models import Request
from apps.requests_board.serializers import RequestListSerializer

from .models import Favorite


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_favorites(request):
    """The current user's saved listings and requests, ready for cards."""
    favs = Favorite.objects.filter(user=request.user)
    listing_ids = [f.listing_id for f in favs if f.listing_id]
    request_ids = [f.request_id for f in favs if f.request_id]

    _not_removed = Q(writer__reviews_received__removed_at__isnull=True)
    listings = (
        Listing.objects.filter(id__in=listing_ids, removed_at__isnull=True)
        .select_related("writer")
        .annotate(
            writer_rating=Avg("writer__reviews_received__rating", filter=_not_removed),
            writer_reviews_count=Count(
                "writer__reviews_received", distinct=True, filter=_not_removed
            ),
        )
    )
    requests = (
        Request.objects.filter(id__in=request_ids, removed_at__isnull=True)
        .select_related("doctor")
        .annotate(proposals_count=Count("proposals"))
    )

    ctx = {"request": request}
    return Response(
        {
            "listings": ListingListSerializer(listings, many=True, context=ctx).data,
            "requests": RequestListSerializer(requests, many=True, context=ctx).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_favorite(request):
    """Add the listing/request to favorites if absent, remove it if present.

    Body: {"listing": <id>} XOR {"request": <id>}. Returns {"favorited": bool}.
    """
    listing_id = request.data.get("listing")
    request_id = request.data.get("request")
    if bool(listing_id) == bool(request_id):
        return Response(
            {"detail": "Indiquez soit une annonce, soit une demande."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if listing_id:
        if not Listing.objects.filter(pk=listing_id).exists():
            return Response({"detail": "Annonce introuvable."}, status=status.HTTP_404_NOT_FOUND)
        target = {"listing_id": listing_id}
    else:
        if not Request.objects.filter(pk=request_id).exists():
            return Response({"detail": "Demande introuvable."}, status=status.HTTP_404_NOT_FOUND)
        target = {"request_id": request_id}

    existing = Favorite.objects.filter(user=request.user, **target).first()
    if existing:
        existing.delete()
        return Response({"favorited": False})
    Favorite.objects.create(user=request.user, **target)
    return Response({"favorited": True}, status=status.HTTP_201_CREATED)
