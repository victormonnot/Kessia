from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Listing


class ListingListSerializer(serializers.ModelSerializer):
    """Compact representation used for the public catalog."""

    writer_name = serializers.SerializerMethodField()

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
            "created_at",
        )
        read_only_fields = fields

    def get_writer_name(self, obj: Listing) -> str:
        return obj.writer.get_full_name() or obj.writer.email


class ListingDetailSerializer(serializers.ModelSerializer):
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
