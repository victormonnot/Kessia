from rest_framework import serializers

from .models import VerificationRequest


class VerificationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRequest
        fields = ("id", "credentials", "status", "created_at", "reviewed_at")
        read_only_fields = fields


class VerificationRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRequest
        fields = ("credentials", "document")

    def validate(self, attrs):
        user = self.context["request"].user
        if user.is_verified:
            raise serializers.ValidationError("Votre compte est déjà vérifié.")
        if VerificationRequest.objects.filter(
            writer=user, status=VerificationRequest.Status.PENDING
        ).exists():
            raise serializers.ValidationError("Une demande est déjà en cours d'examen.")
        return attrs

    def create(self, validated_data):
        validated_data["writer"] = self.context["request"].user
        return super().create(validated_data)
