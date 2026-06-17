from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    # Whether the user confirmed ownership of `email` via the signup link.
    # Distinct from `is_verified` below (the admin-gated writer credential badge).
    is_email_verified = models.BooleanField(default=False)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    # Profile photo (writers especially). Served from MEDIA in dev, S3 in prod.
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_writer = models.BooleanField(default=False)

    # Verified-writer badge (admin-gated flag; see the verification app).
    is_verified = models.BooleanField(default=False)

    # --- Rich writer profile (all optional; mostly relevant for writers) ------
    # Short tagline, e.g. "Médecin-rédacteur · cardiologie".
    headline = models.CharField(max_length=160, blank=True)
    city = models.CharField(max_length=120, blank=True)
    google_scholar_url = models.URLField(blank=True)
    years_experience = models.PositiveIntegerField(null=True, blank=True)
    # Free-form expertise tags, e.g. ["Méta-analyses", "Essais cliniques"].
    expertise_areas = models.JSONField(default=list, blank=True)
    # Per-section visibility chosen by the writer, e.g. {"experiences": false}.
    # A missing key means "visible when it has content" (see the serializer).
    profile_sections = models.JSONField(default=dict, blank=True)
    # Spoken languages, e.g. ["Français", "Anglais"].
    languages = models.JSONField(default=list, blank=True)
    # Typical response-time bucket shown as a trust signal (see ResponseTime).
    response_time = models.CharField(max_length=20, blank=True)

    # Stripe Connect (Express) state for writers receiving payouts.
    stripe_account_id = models.CharField(max_length=255, blank=True)
    stripe_charges_enabled = models.BooleanField(default=False)
    stripe_payouts_enabled = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    # When the user accepted the CGU / privacy policy at signup (RGPD consent trace).
    terms_accepted_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        ordering = ("-date_joined",)

    def __str__(self) -> str:
        return self.email

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self) -> str:
        return self.first_name or self.email


class WriterExperience(models.Model):
    """A line of a writer's career / experience timeline."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="experiences",
    )
    role = models.CharField(max_length=160)
    organization = models.CharField(max_length=160, blank=True)
    start_year = models.PositiveIntegerField(null=True, blank=True)
    end_year = models.PositiveIntegerField(null=True, blank=True)  # null = en cours
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "-start_year")

    def __str__(self) -> str:
        return f"{self.role} — {self.organization}".strip(" —")


class WriterPublication(models.Model):
    """A paper / article in a writer's portfolio (flagship = is_featured)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="publications",
    )
    title = models.CharField(max_length=300)
    url = models.URLField(blank=True)
    venue = models.CharField(max_length=200, blank=True)  # revue / congrès
    year = models.PositiveIntegerField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "-is_featured", "-year")

    def __str__(self) -> str:
        return self.title


class WriterPortfolioItem(models.Model):
    """A work sample / réalisation in a writer's portfolio (the « book »)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="portfolio",
    )
    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=120, blank=True)  # ex. « Article original »
    url = models.URLField(blank=True)
    summary = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("order", "id")

    def __str__(self) -> str:
        return self.title
