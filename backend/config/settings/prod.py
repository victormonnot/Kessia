"""Production settings.

Default deployment is **single-origin**: the Django service serves the built
React SPA, so the refresh/CSRF cookies are first-party (auth, Stripe and the
WebSocket all work without third-party-cookie issues). Free-tier friendly:
Redis and S3 are optional (in-memory Channels + local media fall back when
their env vars are absent). For a split front/back deploy, set
AUTH_COOKIE_SAMESITE=None and the CORS/CSRF origins instead.
"""

import dj_database_url
from decouple import Csv, config

from .base import *  # noqa: F401,F403

DEBUG = False

# Never boot production with a public/placeholder SECRET_KEY — a known key lets
# anyone forge sessions and JWTs. Fail fast instead of running insecurely.
ensure_strong_secret_key(SECRET_KEY)  # noqa: F405

# --- Host / proxy ----------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# One proxy (Render) sits in front: make DRF throttling read the real client IP
# from X-Forwarded-For instead of rate-limiting everyone on the proxy's IP.
REST_FRAMEWORK = {**REST_FRAMEWORK, "NUM_PROXIES": 1}  # noqa: F405
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
AUTH_COOKIE_SECURE = True
# Same-origin deploy → Lax is enough; set None (+HTTPS) only for a split deploy.
AUTH_COOKIE_SAMESITE = config("AUTH_COOKIE_SAMESITE", default="Lax")

# Render injects RENDER_EXTERNAL_HOSTNAME; trust it automatically.
_render_host = config("RENDER_EXTERNAL_HOSTNAME", default="")
if _render_host:
    ALLOWED_HOSTS = list(ALLOWED_HOSTS) + [_render_host]  # noqa: F405
    CSRF_TRUSTED_ORIGINS = list(CSRF_TRUSTED_ORIGINS) + [f"https://{_render_host}"]  # noqa: F405
    FRONTEND_URL = config("FRONTEND_URL", default=f"https://{_render_host}")
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS", default=",".join(CSRF_TRUSTED_ORIGINS), cast=Csv()  # noqa: F405
)

# --- Database: prefer DATABASE_URL, else base's POSTGRES_* -----------------
_database_url = config("DATABASE_URL", default="")
if _database_url:
    DATABASES = {  # noqa: F405
        "default": dj_database_url.parse(_database_url, conn_max_age=600, ssl_require=True)
    }

# --- Static (WhiteNoise) ---------------------------------------------------
MIDDLEWARE = list(MIDDLEWARE)  # noqa: F405
MIDDLEWARE.insert(2, "whitenoise.middleware.WhiteNoiseMiddleware")
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

# --- Media: S3 if a bucket is set, else local (ephemeral, fine for a demo) -
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME", default="")
if AWS_STORAGE_BUCKET_NAME:
    _media_backend = "storages.backends.s3.S3Storage"
    AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY", default="")
    AWS_S3_REGION_NAME = config("AWS_S3_REGION_NAME", default="")
    AWS_S3_ENDPOINT_URL = config("AWS_S3_ENDPOINT_URL", default="") or None
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None
else:
    _media_backend = "django.core.files.storage.FileSystemStorage"

STORAGES = {
    "default": {"BACKEND": _media_backend},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# No S3 bucket → this single-origin service serves /media itself (the seeded demo
# avatars, re-materialised on each deploy by seed_demo). Real user uploads stay
# ephemeral without S3; set AWS_STORAGE_BUCKET_NAME for persistent storage.
SERVE_MEDIA = not AWS_STORAGE_BUCKET_NAME

# --- Serve the built SPA from this service (single origin) -----------------
# The Docker image copies the Vite build to backend/frontend_dist.
_spa_dir = BASE_DIR / "frontend_dist"  # noqa: F405
SERVE_SPA = (_spa_dir / "index.html").exists()
if SERVE_SPA:
    WHITENOISE_ROOT = _spa_dir
    WHITENOISE_INDEX_FILE = True

# --- Channels: Redis if provided, else in-memory (single free instance) ----
_redis_url = config("REDIS_URL", default="")
if _redis_url:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [_redis_url]},
        }
    }
