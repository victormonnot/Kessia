#!/usr/bin/env sh
set -e

python manage.py migrate --noinput
# Creates an admin if DJANGO_SUPERUSER_EMAIL/PASSWORD are set (no-op otherwise).
python manage.py ensure_superuser
# Loads demo data when SEED_DEMO=true (idempotent).
if [ "$SEED_DEMO" = "true" ]; then
  python manage.py seed_demo
fi

exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application
