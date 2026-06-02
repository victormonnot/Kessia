from .base import *  # noqa: F401,F403

DEBUG = False

# Tests run on Postgres (the runtime DB), inherited from base.py. SQLite was used
# for speed in the MVP, but it does not implement real row-level locking, so it
# cannot exercise `select_for_update` (atomic proposal acceptance) or other
# Postgres-specific behaviour. pytest-django creates/destroys a `test_*` database
# on the docker-compose Postgres service.

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Use local in-memory file storage during tests (no S3, no disk writes).
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
