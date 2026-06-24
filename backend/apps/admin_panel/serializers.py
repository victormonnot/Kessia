from rest_framework import serializers

from apps.listings.models import Listing
from apps.orders.models import Order
from apps.requests_board.models import Request
from apps.reviews.models import Review
from apps.users.models import User

from .models import AuditLog, Report


class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_deleted = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name", "full_name",
            "is_writer", "is_verified", "is_staff", "is_active",
            "is_deleted", "deleted_at", "date_joined",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name()

    def get_is_deleted(self, obj) -> bool:
        return obj.deleted_at is not None


class AdminUserDetailSerializer(AdminUserSerializer):
    listings_count = serializers.SerializerMethodField()
    orders_placed_count = serializers.SerializerMethodField()
    orders_received_count = serializers.SerializerMethodField()
    reviews_received_count = serializers.SerializerMethodField()

    class Meta(AdminUserSerializer.Meta):
        fields = AdminUserSerializer.Meta.fields + (
            "bio", "headline", "city", "stripe_account_id", "stripe_payouts_enabled",
            "listings_count", "orders_placed_count", "orders_received_count",
            "reviews_received_count",
        )

    def get_listings_count(self, obj) -> int:
        return obj.listings.count()

    def get_orders_placed_count(self, obj) -> int:
        return obj.orders_placed.count()

    def get_orders_received_count(self, obj) -> int:
        return obj.orders_received.count()

    def get_reviews_received_count(self, obj) -> int:
        return obj.reviews_received.count()


class AdminListingSerializer(serializers.ModelSerializer):
    writer_email = serializers.EmailField(source="writer.email", read_only=True)
    is_removed = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id", "title", "specialty", "price", "is_published", "is_removed",
            "removed_at", "writer", "writer_email", "created_at",
        )

    def get_is_removed(self, obj) -> bool:
        return obj.removed_at is not None


class AdminRequestSerializer(serializers.ModelSerializer):
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    is_removed = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = (
            "id", "title", "specialty", "budget", "status", "is_removed",
            "removed_at", "doctor", "doctor_email", "created_at",
        )

    def get_is_removed(self, obj) -> bool:
        return obj.removed_at is not None


class AdminReviewSerializer(serializers.ModelSerializer):
    writer_email = serializers.EmailField(source="writer.email", read_only=True)
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    is_removed = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            "id", "rating", "comment", "is_removed", "removed_at", "order",
            "writer", "writer_email", "doctor", "doctor_email", "created_at",
        )

    def get_is_removed(self, obj) -> bool:
        return obj.removed_at is not None


class AdminOrderSerializer(serializers.ModelSerializer):
    doctor_email = serializers.EmailField(source="doctor.email", read_only=True)
    writer_email = serializers.EmailField(source="writer.email", read_only=True)
    is_disputed = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id", "status", "payment_status", "amount", "currency", "is_disputed",
            "disputed_at", "doctor", "doctor_email", "writer", "writer_email",
            "application_fee_amount", "created_at", "updated_at",
        )

    def get_is_disputed(self, obj) -> bool:
        return obj.disputed_at is not None


class AdminOrderDetailSerializer(AdminOrderSerializer):
    deliverables = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta(AdminOrderSerializer.Meta):
        fields = AdminOrderSerializer.Meta.fields + (
            "message", "stripe_payment_intent_id", "stripe_charge_id",
            "stripe_transfer_id", "deliverables", "messages",
        )

    def get_deliverables(self, obj):
        return [
            {"id": d.id, "filename": d.file.name.split("/")[-1], "uploaded_at": d.uploaded_at}
            for d in obj.deliverables.all()
        ]

    def get_messages(self, obj):
        # Conversation access for dispute resolution only (admin views one order).
        out = []
        for conv in obj.conversations.all():
            for m in conv.messages.select_related("sender").all():
                out.append(
                    {"sender": m.sender.email, "body": m.body, "created_at": m.created_at}
                )
        return out


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            "id", "actor", "actor_email", "action", "target_type", "target_id",
            "detail", "created_at",
        )

    def get_actor_email(self, obj):
        return obj.actor.email if obj.actor_id else None


class ReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.EmailField(source="reporter.email", read_only=True)

    class Meta:
        model = Report
        fields = (
            "id", "reporter", "reporter_email", "target_type", "target_id",
            "reason", "status", "resolved_at", "created_at",
        )
        read_only_fields = (
            "id", "reporter", "reporter_email", "status", "resolved_at", "created_at",
        )


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("target_type", "target_id", "reason")
