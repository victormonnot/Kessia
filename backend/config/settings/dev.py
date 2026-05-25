from .base import *  # noqa: F401,F403

DEBUG = True

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Permit all origins in dev for convenience; production must lock this down.
CORS_ALLOW_ALL_ORIGINS = False
