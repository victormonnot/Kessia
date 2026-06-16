from django.conf import settings
from django.db import models

from apps.listings.models import Listing
from apps.requests_board.models import Request


class Favorite(models.Model):
    """A user's saved listing OR request (exactly one target per row)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="favorited_by",
    )
    request = models.ForeignKey(
        Request,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="favorited_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("user", "listing"),
                condition=models.Q(listing__isnull=False),
                name="uniq_favorite_user_listing",
            ),
            models.UniqueConstraint(
                fields=("user", "request"),
                condition=models.Q(request__isnull=False),
                name="uniq_favorite_user_request",
            ),
            # Exactly one of listing / request must be set.
            models.CheckConstraint(
                name="favorite_exactly_one_target",
                check=(
                    models.Q(listing__isnull=False, request__isnull=True)
                    | models.Q(listing__isnull=True, request__isnull=False)
                ),
            ),
        ]

    def __str__(self) -> str:
        target = self.listing_id and f"listing #{self.listing_id}" or f"request #{self.request_id}"
        return f"{self.user_id} ♥ {target}"
