from rest_framework import serializers

from apps.orders.models import Order
from apps.users.serializers import UserPublicSerializer

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    doctor = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ("id", "order", "doctor", "writer", "rating", "comment", "created_at")
        read_only_fields = fields


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ("order", "rating", "comment")

    def validate(self, attrs):
        order = attrs["order"]
        user = self.context["request"].user
        if order.doctor_id != user.id:
            raise serializers.ValidationError(
                "Seul le médecin de la commande peut laisser un avis."
            )
        if order.status != Order.Status.COMPLETED:
            raise serializers.ValidationError(
                "Vous ne pouvez évaluer qu'une commande finalisée."
            )
        if hasattr(order, "review"):
            raise serializers.ValidationError("Cette commande a déjà été évaluée.")
        return attrs

    def create(self, validated_data):
        order = validated_data["order"]
        validated_data["doctor"] = order.doctor
        validated_data["writer"] = order.writer
        return super().create(validated_data)
