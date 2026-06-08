# Deploying Kessia (Railway / Render)

Kessia deploys as **four managed pieces**: a PostgreSQL database, a Redis
instance (Channels layer), the Django backend (ASGI), and the React frontend
(static site). Media files (deliverables, verification documents) live in an
**S3-compatible bucket** because the platform filesystem is ephemeral.

Stripe runs in **test mode** — never put live keys in a demo deployment.

## 1. Provision the managed services

- **PostgreSQL** → gives you a `DATABASE_URL`.
- **Redis** → gives you a `REDIS_URL`.
- **Object storage** (AWS S3, Cloudflare R2, Backblaze B2, …) → create a private
  bucket and an access key/secret.

## 2. Backend service (Django, ASGI)

- **Root directory:** `backend/`
- **Build:** `pip install -r requirements.txt`
- **Release:** `python manage.py migrate --noinput && python manage.py collectstatic --noinput`
- **Start:** `daphne -b 0.0.0.0 -p $PORT config.asgi:application`

(The `backend/Procfile` already declares the `release` and `web` commands for
platforms that read it.)

### Backend environment variables

```
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=<long random string>
DJANGO_ALLOWED_HOSTS=api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://app.yourdomain.com

DATABASE_URL=<from the Postgres add-on>
REDIS_URL=<from the Redis add-on>

# Cross-site cookies (frontend on a different domain than the API)
AUTH_COOKIE_SAMESITE=None

# Email (SendGrid example; Mailgun is analogous)
DEFAULT_FROM_EMAIL=Kessia <no-reply@yourdomain.com>
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<SendGrid API key>
EMAIL_USE_TLS=True

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
KESSIA_PLATFORM_FEE_PERCENT=15

# S3-compatible object storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=kessia-media
AWS_S3_REGION_NAME=eu-west-1
AWS_S3_ENDPOINT_URL=        # leave blank for AWS S3; set for R2/B2/MinIO
```

## 3. Frontend service (static site)

- **Root directory:** `frontend/`
- **Build:** `npm ci && npm run build`
- **Publish directory:** `dist/`
- **Environment:** `VITE_API_BASE_URL=https://api.yourdomain.com/api/v1`

The SPA opens a WebSocket to `wss://api.yourdomain.com/ws/conversations/<id>/`;
it derives that URL from `VITE_API_BASE_URL`, so no extra variable is needed.

## 4. Stripe configuration

1. In the Stripe **test** dashboard, add a webhook endpoint:
   `https://api.yourdomain.com/api/v1/payments/webhook/`
   (events: `payment_intent.succeeded`, `account.updated`).
2. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Writers onboard via Stripe Connect Express; the return/refresh URLs are built
   from `FRONTEND_URL`.

## 5. First-run

After the first deploy, create an admin user to moderate listings, badges and
verification requests:

```
python manage.py createsuperuser
```

Optionally load demo data on a staging environment: `python manage.py seed_demo`.
