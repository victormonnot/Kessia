from rest_framework import serializers

from apps.listings.serializers import ListingListSerializer
from apps.users.serializers import UserPublicSerializer

from .models import Order

# pending -> accepted | declined ; accepted -> delivered. Anything else: 400.
_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    Order.Status.PENDING: {Order.Status.ACCEPTED, Order.Status.DECLINED},
    Order.Status.ACCEPTED: {Order.Status.DELIVERED},
}


class OrderDetailSerializer(serializers.ModelSerializer):
    listing = ListingListSerializer(read_only=True)
    doctor = UserPublicSerializer(read_only=True)
    writer = UserPublicSerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "listing",
            "proposal",
            "doctor",
            "writer",
            "status",
            "message",
            "amount",
            "currency",
            "payment_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("listing", "message")

    def validate_listing(self, listing):
        request = self.context["request"]
        if listing.writer_id == request.user.id:
            raise serializers.ValidationError("You cannot order your own listing.")
        if not listing.is_published:
            raise serializers.ValidationError("This listing is not currently published.")
        return listing

    def create(self, validated_data):
        # Snapshot the writer and the agreed price at order time; never trust the
        # live listing price later in the engagement's lifecycle.
        listing = validated_data["listing"]
        validated_data["doctor"] = self.context["request"].user
        validated_data["writer"] = listing.writer
        validated_data["amount"] = listing.price
        return super().create(validated_data)


class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)

    def validate_status(self, new_status: str) -> str:
        current = self.instance.status
        allowed = _ALLOWED_TRANSITIONS.get(current, set())
        if new_status not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from '{current}' to '{new_status}'."
            )
        return new_status
