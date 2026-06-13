import os

from rest_framework import serializers

from apps.common.uploads import DELIVERABLE_RULES, upload_error
from apps.listings.serializers import ListingListSerializer
from apps.users.serializers import UserPublicSerializer

from .models import Deliverable, Order
from .services import can_transition, role_for


class DeliverableSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()

    class Meta:
        model = Deliverable
        fields = ("id", "filename", "note", "uploaded_at")
        read_only_fields = fields

    def get_filename(self, obj: Deliverable) -> str:
        return os.path.basename(obj.file.name)


class DeliverableUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ("file", "note")

    def validate_file(self, value):
        error = upload_error(value, DELIVERABLE_RULES)
        if error:
            raise serializers.ValidationError(error)
        return value


class OrderDetailSerializer(serializers.ModelSerializer):
    listing = ListingListSerializer(read_only=True)
    doctor = UserPublicSerializer(read_only=True)
    writer = UserPublicSerializer(read_only=True)
    deliverables = DeliverableSerializer(many=True, read_only=True)
    has_review = serializers.SerializerMethodField()

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
            "deliverables",
            "has_review",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_has_review(self, obj) -> bool:
        return hasattr(obj, "review")


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("listing", "message")

    def validate_listing(self, listing):
        request = self.context["request"]
        if listing.writer_id == request.user.id:
            raise serializers.ValidationError("Vous ne pouvez pas commander votre propre annonce.")
        if not listing.is_published:
            raise serializers.ValidationError("Cette annonce n'est pas disponible actuellement.")
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
        order = self.instance
        user = self.context["request"].user

        # Delivery is performed by uploading the finished work, not by PATCH.
        if new_status == Order.Status.DELIVERED:
            raise serializers.ValidationError(
                "La livraison se fait en téléversant le travail finalisé."
            )

        role = role_for(order, user)
        if not can_transition(order, new_status, role):
            raise serializers.ValidationError(
                "Cette action n'est pas autorisée pour le statut actuel de la commande."
            )
        return new_status
