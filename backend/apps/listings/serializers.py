from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Listing


class WriterRatingMixin(serializers.Serializer):
    """Exposes the listing writer's aggregate rating.

    Reads the `writer_rating`/`writer_reviews_count` annotations added by
    ListingViewSet (no extra query on the catalog/detail). Falls back to
    None/0 when the queryset isn't annotated (e.g. the public profile, which
    shows the writer's overall rating separately).
    """

    writer_rating = serializers.SerializerMethodField()
    writer_reviews_count = serializers.SerializerMethodField()
    writer_is_verified = serializers.BooleanField(source="writer.is_verified", read_only=True)

    def get_writer_rating(self, obj):
        val = getattr(obj, "writer_rating", None)
        return round(float(val), 1) if val is not None else None

    def get_writer_reviews_count(self, obj):
        return getattr(obj, "writer_reviews_count", 0) or 0


class ListingListSerializer(WriterRatingMixin, serializers.ModelSerializer):
    """Compact representation used for the public catalog."""

    writer_name = serializers.SerializerMethodField()
    writer_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id",
            "title",
            "specialty",
            "deliverable_type",
            "price",
            "turnaround_days",
            "is_published",
            "writer",
            "writer_name",
            "writer_avatar",
            "writer_rating",
            "writer_reviews_count",
            "writer_is_verified",
            "created_at",
        )
        read_only_fields = fields

    def get_writer_name(self, obj: Listing) -> str:
        return obj.writer.get_full_name() or obj.writer.email

    def get_writer_avatar(self, obj: Listing) -> str | None:
        if not obj.writer.avatar:
            return None
        url = obj.writer.avatar.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


class ListingDetailSerializer(WriterRatingMixin, serializers.ModelSerializer):
    writer = UserPublicSerializer(read_only=True)

    class Meta:
        model = Listing
        fields = (
            "id",
            "writer",
            "title",
            "description",
            "specialty",
            "deliverable_type",
            "price",
            "turnaround_days",
            "is_published",
            "writer_rating",
            "writer_reviews_count",
            "writer_is_verified",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ListingWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = (
            "title",
            "description",
            "specialty",
            "deliverable_type",
            "price",
            "turnaround_days",
            "is_published",
        )

    def create(self, validated_data):
        validated_data["writer"] = self.context["request"].user
        return super().create(validated_data)
