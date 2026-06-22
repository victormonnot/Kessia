from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from .models import User, WriterExperience, WriterPortfolioItem, WriterPublication
from .tokens import email_verification_token


class WriterExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WriterExperience
        fields = ("id", "role", "organization", "start_year", "end_year", "description", "order")


class WriterPublicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WriterPublication
        fields = ("id", "title", "url", "venue", "year", "is_featured", "order")


class WriterPortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = WriterPortfolioItem
        fields = ("id", "title", "kind", "url", "summary", "order")


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
            "avatar",
            "headline",
            "city",
            "google_scholar_url",
            "years_experience",
            "expertise_areas",
            "profile_sections",
            "languages",
            "response_time",
            "is_writer",
            "is_verified",
            "is_staff",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "email",
            "is_email_verified",
            "avatar",
            "is_writer",
            "is_verified",
            "is_staff",
            "date_joined",
        )


class UserPublicSerializer(serializers.ModelSerializer):
    """Slim representation used when nesting a user inside another resource."""

    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "bio", "avatar", "is_writer")
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    accept_terms = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name", "accept_terms")
        extra_kwargs = {
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
        }

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError(
                "Vous devez accepter les CGU et la politique de confidentialité."
            )
        return value

    def create(self, validated_data):
        validated_data.pop("accept_terms", None)
        user = User.objects.create_user(**validated_data)
        user.terms_accepted_at = timezone.now()
        user.save(update_fields=["terms_accepted_at"])
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    # allow_null lets the client clear the photo (PATCH avatar=null).
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "bio",
            "avatar",
            "headline",
            "city",
            "google_scholar_url",
            "years_experience",
            "expertise_areas",
            "profile_sections",
            "languages",
            "response_time",
        )


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


class ChangePasswordSerializer(serializers.Serializer):
    """Logged-in password change: re-check the current password first."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ChangeEmailSerializer(serializers.Serializer):
    """Change the account email; the new address starts out unverified."""

    new_email = serializers.EmailField()
    current_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_new_email(self, value):
        user = self.context["request"].user
        if User.objects.exclude(pk=user.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return value

    def save(self):
        user = self.context["request"].user
        user.email = self.validated_data["new_email"]
        user.is_email_verified = False
        user.save(update_fields=["email", "is_email_verified"])
        return user


class DeleteAccountSerializer(serializers.Serializer):
    """Account deletion requires the current password as a safety confirmation."""

    current_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value


class PublicWriterSerializer(serializers.ModelSerializer):
    """Shareable public profile for a writer: bio, specialties, active listings,
    verified badge and rating. The rating fields are placeholders until reviews
    land (Phase 7)."""

    specialties = serializers.SerializerMethodField()
    listings = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    rating_breakdown = serializers.SerializerMethodField()
    completed_orders = serializers.SerializerMethodField()
    experiences = WriterExperienceSerializer(many=True, read_only=True)
    publications = WriterPublicationSerializer(many=True, read_only=True)
    portfolio = WriterPortfolioSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "first_name",
            "last_name",
            "bio",
            "avatar",
            "headline",
            "city",
            "google_scholar_url",
            "years_experience",
            "expertise_areas",
            "profile_sections",
            "languages",
            "response_time",
            "date_joined",
            "is_verified",
            "specialties",
            "listings",
            "experiences",
            "publications",
            "portfolio",
            "avg_rating",
            "reviews_count",
            "rating_breakdown",
            "completed_orders",
        )
        read_only_fields = fields

    def _published(self, obj):
        return obj.listings.filter(is_published=True, removed_at__isnull=True)

    def get_specialties(self, obj):
        return sorted(set(self._published(obj).values_list("specialty", flat=True)))

    def get_listings(self, obj):
        # Local import avoids a circular import (listings.serializers imports this module).
        from apps.listings.serializers import ListingListSerializer

        # Pass context so nested listings get absolute writer_avatar URLs.
        return ListingListSerializer(self._published(obj), many=True, context=self.context).data

    def _rating(self, obj):
        from django.db.models import Avg, Count

        return obj.reviews_received.filter(removed_at__isnull=True).aggregate(
            avg=Avg("rating"), count=Count("id")
        )

    def get_avg_rating(self, obj):
        avg = self._rating(obj)["avg"]
        return round(float(avg), 1) if avg is not None else None

    def get_reviews_count(self, obj):
        return self._rating(obj)["count"]

    def get_rating_breakdown(self, obj):
        from django.db.models import Count

        rows = (
            obj.reviews_received.filter(removed_at__isnull=True)
            .values("rating")
            .annotate(n=Count("id"))
        )
        counts = {row["rating"]: row["n"] for row in rows}
        return {str(star): counts.get(star, 0) for star in (5, 4, 3, 2, 1)}

    def get_completed_orders(self, obj):
        from apps.orders.models import Order

        return obj.orders_received.filter(status=Order.Status.COMPLETED).count()
