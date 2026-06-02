# Limitations & scope notes (v1)

The MVP non-goals listed below have been **resolved in v1**; the remaining
section documents trade-offs that are still deliberately out of scope.

## Resolved since the MVP

- **Payments.** Stripe Connect (test mode): the doctor pays after acceptance,
  funds are held, released on completion minus a 15% platform fee, with
  auto-refund on cancellation and idempotent webhooks.
- **Real-time chat.** Django Channels over ASGI/Daphne; conversations between any
  two users (optionally tied to an order), with REST history + WebSocket live
  delivery and unread counts.
- **File uploads.** Writers upload deliverables and verification documents
  (Django storage: local in dev, S3-compatible in prod).
- **Transactional email.** Event emails (order lifecycle, proposals, messages),
  console in dev, SMTP provider in prod.
- **Badges / reputation.** Reviews gated to completed orders aggregate onto
  profiles and listings; an admin-approved verified badge is in place.
- **Atomic proposal acceptance.** Accepting a proposal now creates the order,
  closes the request and auto-rejects the others in a single `select_for_update`
  transaction.
- **Refresh token in `localStorage`.** Moved to an httpOnly cookie with a
  double-submit CSRF check; the access token lives in memory only.
- **Production settings.** `config/settings/prod.py` exists (secure cookies, S3
  storage, Redis channel layer, WhiteNoise static); see `DEPLOYMENT.md`.
- **Tests on Postgres.** The test database is Postgres (matching runtime), so
  row-locking and other Postgres behaviour are actually exercised.

## Still out of scope

- **Email is sent inline** (in the request path), not via a task queue. Fine at
  this volume; a Celery/RQ worker would be the next step.
- **No CI pipeline.** Tests run via `docker compose exec`; a GitHub Actions
  workflow can be layered on without changing this structure.
- **No rate limiting** beyond DRF defaults; no per-IP throttling on auth.
- **Hard delete only** (no soft deletes); FK `PROTECT`/`SET_NULL` guard against
  orphaning orders/conversations.
- **Cross-site cookies in prod** require `AUTH_COOKIE_SAMESITE=None` + HTTPS and
  the frontend origin in `CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS` (see
  `DEPLOYMENT.md`).
- **Out of scope by design:** i18n/multi-currency, SMS, real credential
  verification (the badge is an admin-gated flag).

## Manual end-to-end script

Run after `docker compose up --build` + `seed_demo` (Stripe test keys set):

1. Register a doctor; activate writer mode on a second account; the writer
   onboards a Stripe Express account (Paiements tab).
2. From the writer's public profile (`/redacteurs/:id`), the doctor sends a
   pre-sales message (conversation with no order).
3. The doctor discovers a writer via search/filters, or posts a request and
   accepts a proposal → an order is created.
4. The writer accepts the order → the doctor pays (test card `4242…`) → status
   `in_progress`, payment held.
5. The parties chat live on the order's conversation (WebSocket).
6. The writer uploads a deliverable; the doctor downloads it and confirms
   completion → payment released minus 15%.
7. On a separate paid order, the doctor cancels → auto-refund.
8. The doctor reviews the completed order → rating appears on the writer's
   profile and listings.
9. The writer requests verification → an admin approves it in Django admin → the
   "Vérifié" badge appears.
10. Confirm event emails (console in dev), mobile layout, and a green test suite.
