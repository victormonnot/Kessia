# Known MVP Limitations

Scope decisions and tradeoffs deliberately accepted to ship the MVP by 2026-07-17. None of these are bugs — they are documented non-goals.

## Product

- **Proposal acceptance is not atomic.** Accepting one proposal on a request does not auto-reject the other proposals and does not auto-close the request. The doctor closes the request manually.
- **No payments.** Stripe / payouts are post-MVP.
- **No real-time chat.** The doctor's `message` on an order and the writer's `message` on a proposal are the only communication channels in-app.
- **No file uploads.** No avatars, no deliverable attachments.
- **No transactional email.** The dev settings use the console email backend.
- **No badges / reputation system.** Verified-writer flow is post-MVP.
- **Hard delete only.** Deleting a listing or a request removes the row. We rely on the `PROTECT` FK on orders to prevent deleting a listing that has orders attached.

## Security

- **Refresh token in `localStorage`.** Convenient for the SPA but readable by any script that achieves XSS on our origin. Acceptable for an MVP that handles no payments or PHI; revisit before exposing real users.
- **No rate limiting.** DRF defaults only; no per-IP throttling on auth endpoints.

## Ops

- **No CI in this bootstrap.** Tests run locally via `docker compose exec`. A GitHub Actions workflow can be added on top without changes to this layout.
- **No production settings module.** `config/settings/prod.py` is intentionally left out — it'll be added during the deployment step (week 10 per `High-LevelPlan.md`).
- **Test DB is SQLite in-memory.** The runtime DB is Postgres 16. The two stay close enough for the model-shape tests in this MVP; integration tests that depend on Postgres-specific behaviour should be added when needed.

## Manual end-to-end script

This replaces the README walkthrough the bootstrap spec called for. Run after `docker compose up --build`:

1. Register user A → `POST /api/v1/users/me/activate-writer/` (or the writer toggle in the UI) → create a listing.
2. Register user B (stays a doctor) → browse `/listings` → place an order with a message.
3. Log back in as A → writer dashboard shows the order → accept → mark delivered.
4. Log back in as B → doctor dashboard reflects the status changes.
5. As B, post a request on `/requests`.
6. As A, submit a proposal on B's request.
7. As B, accept A's proposal. Confirm the request stays `open` (see "Proposal acceptance is not atomic" above).
8. Filter `/listings` by specialty + deliverable_type, search by keyword. Same on `/requests`.
9. In DevTools, delete `accessToken` from `localStorage` → trigger any authenticated request → the axios interceptor refreshes via `/auth/refresh/` and retries once.
