"""Idempotently create/update a superuser from env vars (for hosts without a
shell, e.g. Render free). No-op if the env vars are unset."""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update a superuser from DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD."

    def handle(self, *args, **options):
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        if not email or not password:
            self.stdout.write("ensure_superuser: env vars not set, skipping.")
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(email=email)
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        self.stdout.write(
            self.style.SUCCESS(
                f"ensure_superuser: {'created' if created else 'updated'} {email}"
            )
        )
