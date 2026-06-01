"""Production settings for Railway / Render.

Everything sensitive is driven by environment variables. Media (deliverables,
verification documents) goes to S3-compatible object storage because the
platform filesystem is ephemeral; static files are served by WhiteNoise; the
Channels layer uses Redis; the refresh/CSRF cookies are Secure + SameSite=None
for a cross-site SPA.
"""

import dj_database_url
from decouple import config

from .base import *  # noqa: F401,F403

DEBUG = False

# --- Security (behind the platform's TLS-terminating proxy) ----------------
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Cross-site SPA: the httpOnly refresh cookie + CSRF cookie must cross origins.
AUTH_COOKIE_SECURE = True
AUTH_COOKIE_SAMESITE = config("AUTH_COOKIE_SAMESITE", default="None")

# --- Database: prefer DATABASE_URL (Railway/Render), else base's POSTGRES_* --
_database_url = config("DATABASE_URL", default="")
if _database_url:
    DATABASES = {  # noqa: F405
        "default": dj_database_url.parse(_database_url, conn_max_age=600, ssl_require=True)
    }

# --- Static files via WhiteNoise (right after SecurityMiddleware) ----------
MIDDLEWARE = list(MIDDLEWARE)  # noqa: F405
MIDDLEWARE.insert(2, "whitenoise.middleware.WhiteNoiseMiddleware")
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

# --- Storage: S3-compatible media + compressed static ----------------------
STORAGES = {
    "default": {"BACKEND": "storages.backends.s3.S3Storage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="")
AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default="") or None
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None  # private bucket; deliverables are streamed via the API

# --- Channels: Redis layer (multi-process safe) ----------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [config("REDIS_URL", default="redis://redis:6379/0")]},
    }
}
