from rest_framework import serializers

from apps.users.serializers import UserPublicSerializer

from .models import Proposal, Request


class RequestListSerializer(serializers.ModelSerializer):
    doctor = UserPublicSerializer(read_only=True)
    proposals_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Request
        fields = (
            "id",
            "doctor",
            "title",
            "specialty",
            "deadline",
            "budget",
            "status",
            "proposals_count",
            "created_at",
        )
        read_only_fields = fields


class RequestDetailSerializer(serializers.ModelSerializer):
    doctor = UserPublicSerializer(read_only=True)

    class Meta:
        model = Request
        fields = (
            "id",
            "doctor",
            "title",
            "description",
            "specialty",
            "deadline",
            "budget",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "doctor", "created_at", "updated_at")


class RequestWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ("title", "description", "specialty", "deadline", "budget", "status")
        extra_kwargs = {"status": {"required": False}}

    def validate_status(self, value):
        if self.instance is None and value and value != Request.Status.OPEN:
            raise serializers.ValidationError("A new request must start as 'open'.")
        return value

    def create(self, validated_data):
        validated_data["doctor"] = self.context["request"].user
        return super().create(validated_data)


class ProposalSerializer(serializers.ModelSerializer):
    writer = UserPublicSerializer(read_only=True)

    class Meta:
        model = Proposal
        fields = (
            "id",
            "request",
            "writer",
            "message",
            "price",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ProposalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ("message", "price")

    def validate(self, attrs):
        request_obj = self.context["request_obj"]
        writer = self.context["request"].user
        if Proposal.objects.filter(request=request_obj, writer=writer).exists():
            raise serializers.ValidationError(
                "You have already submitted a proposal on this request."
            )
        if request_obj.status != Request.Status.OPEN:
            raise serializers.ValidationError("This request is no longer accepting proposals.")
        return attrs

    def create(self, validated_data):
        validated_data["request"] = self.context["request_obj"]
        validated_data["writer"] = self.context["request"].user
        return super().create(validated_data)


_ALLOWED_PROPOSAL_TRANSITIONS: dict[str, set[str]] = {
    Proposal.Status.PENDING: {Proposal.Status.ACCEPTED, Proposal.Status.REJECTED},
}


class ProposalUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ("status",)

    def validate_status(self, new_status: str) -> str:
        current = self.instance.status
        allowed = _ALLOWED_PROPOSAL_TRANSITIONS.get(current, set())
        if new_status not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition proposal from '{current}' to '{new_status}'."
            )
        return new_status
