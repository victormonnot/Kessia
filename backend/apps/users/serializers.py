from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from .models import User
from .tokens import email_verification_token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "is_email_verified",
            "first_name",
            "last_name",
            "bio",
            "is_writer",
            "is_verified",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "email",
            "is_email_verified",
            "is_writer",
            "is_verified",
            "date_joined",
        )


class UserPublicSerializer(serializers.ModelSerializer):
    """Slim representation used when nesting a user inside another resource."""

    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "bio", "is_writer")
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name")
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "bio")


class PasswordResetRequestSerializer(serializers.Serializer):
    """Step 1: the user submits their email to receive a reset link."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Step 2: the user submits the emailed uid/token plus a new password.

    Tokens come from Django's ``default_token_generator``: they are signed,
    time-limited (``PASSWORD_RESET_TIMEOUT``) and self-invalidate once the
    password changes (the token hash folds in the current password hash).
    """

    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError(
                {"uid": "Lien de réinitialisation invalide."}
            ) from None
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": "Lien de réinitialisation invalide ou expiré."}
            )
        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        return user


class EmailVerifySerializer(serializers.Serializer):
    """Validates the emailed uid/token from the signup confirmation link."""

    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"uid": "Lien de confirmation invalide."}) from None
        if not email_verification_token.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": "Lien de confirmation invalide ou expiré."}
            )
        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        if not user.is_email_verified:
            user.is_email_verified = True
            user.save(update_fields=["is_email_verified"])
        return user


class PublicWriterSerializer(serializers.ModelSerializer):
    """Shareable public profile for a writer: bio, specialties, active listings,
    verified badge and rating. The rating fields are placeholders until reviews
    land (Phase 7)."""

    specialties = serializers.SerializerMethodField()
    listings = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "bio",
            "is_verified",
            "specialties",
            "listings",
            "avg_rating",
            "reviews_count",
        )
        read_only_fields = fields

    def _published(self, obj):
        return obj.listings.filter(is_published=True)

    def get_specialties(self, obj):
        return sorted(set(self._published(obj).values_list("specialty", flat=True)))

    def get_listings(self, obj):
        # Local import avoids a circular import (listings.serializers imports this module).
        from apps.listings.serializers import ListingListSerializer

        return ListingListSerializer(self._published(obj), many=True).data

    def _rating(self, obj):
        from django.db.models import Avg, Count

        return obj.reviews_received.aggregate(avg=Avg("rating"), count=Count("id"))

    def get_avg_rating(self, obj):
        avg = self._rating(obj)["avg"]
        return round(float(avg), 1) if avg is not None else None

    def get_reviews_count(self, obj):
        return self._rating(obj)["count"]
