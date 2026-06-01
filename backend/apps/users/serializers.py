from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "bio",
            "is_writer",
            "date_joined",
        )
        read_only_fields = ("id", "email", "is_writer", "date_joined")


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

    def get_avg_rating(self, obj):
        return None  # populated in Phase 7 (reviews)

    def get_reviews_count(self, obj):
        return 0  # populated in Phase 7 (reviews)
