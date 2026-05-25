from .base import *  # noqa: F401,F403

DEBUG = False

# In-memory SQLite for fast unit tests. Runtime DB is Postgres via docker-compose.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
