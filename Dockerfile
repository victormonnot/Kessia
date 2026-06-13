# Single-image deploy: build the React SPA, then serve it + the API from Django
# (ASGI/Daphne). One origin → cookies, Stripe and the WebSocket all just work.

# --- Stage 1: build the SPA ---
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API in production:
ENV VITE_API_BASE_URL=/api/v1
# Vite bakes env vars at build time. Render exposes its env vars as Docker
# build args, so declaring the ARG lets VITE_GOOGLE_CLIENT_ID reach the build.
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# --- Stage 2: Django backend ---
FROM python:3.12-slim AS backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.prod
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
# Bring in the built SPA (prod settings serve it via WhiteNoise).
COPY --from=frontend /app/frontend/dist ./frontend_dist
RUN python manage.py collectstatic --noinput
# Render/Railway inject $PORT. start.sh runs migrate, ensures the admin, then daphne.
CMD ["sh", "start.sh"]
