# Kessia — Bug Tracking

> Defects found during development and QA, with severity, root cause and
> resolution. Bugs were tracked as GitHub issues / PRs and fixed on `fix/*`
> branches (Conventional `fix:` commits). All blocking bugs were resolved before
> the next Sprint Review.

**Severity:** Critical (feature unusable in prod) · High · Medium · Low (cosmetic).

---

## Resolved

| ID | Title | Severity | Area | Root cause | Resolution |
|----|-------|----------|------|------------|------------|
| KES-01 | Production emails never delivered | **Critical** | Email / Deploy | Render blocks outbound SMTP ports (25/465/587), so every send timed out | Switched sending to the **Brevo HTTPS API** (`django-anymail`); SMTP retained as fallback |
| KES-02 | Verification / reset email links broken | **High** | Email | Django template auto-escaping turned `&` into `&amp;`, corrupting the `?uid=…&token=…` query | Wrapped the plain-text email templates in an `autoescape off` … `endautoescape` block (disables Django auto-escaping) |
| KES-03 | Google sign-in popup blank in production | **High** | Auth / Deploy | Django's default `Cross-Origin-Opener-Policy: same-origin` severed the popup↔page link; invisible locally (Vite serves the dev page without the header) | Set `SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"` |
| KES-04 | Brevo rejected all sends (`Unauthorized IP`) | **High** | Email / Config | Brevo's "authorised IPs" security setting was enabled, blocking the dynamic Render IP | Disabled IP restriction (provider side); key kept secret in env vars |
| KES-05 | `DEFAULT_FROM_EMAIL` rejected by provider | Medium | Email / Config | Value was a concatenated `Name<email>` (no space/brackets) → not a verified sender | Corrected to the `Name <email>` format using the verified sender |
| KES-06 | Unbounded file uploads | Medium | Security | Deliverable and verification uploads accepted any file of any size | Shared validator: size cap (25 Mo / 10 Mo) + extension allowlist |
| KES-07 | Backend container missing provider env vars | Medium | Local config | `docker-compose` forwarded only a subset of variables to the backend | Added `env_file: .env` to the backend service |
| KES-08 | Logged-in users could reach `/login` & `/register` | Medium | Frontend / UX | No guard on guest-only routes | Added `GuestRoute`; auth-aware footer links |
| KES-09 | Stale-error "flash" on page load | Low | Frontend / UX | A cached query error was rendered for ~0.5 s while a background refetch recovered | Show the loading state while `isError && isFetching` |
| KES-10 | Demo login buttons failed | Low | Data / Demo | Demo accounts were never seeded into the DB | `seed_demo` creates them; marked email-verified |
| KES-11 | Stale demo data after taxonomy change | Low | Data / Demo | Listings kept old specialty / paper-type keys → raw keys shown in the UI | Re-seeded after the enum updates |

## Known issues / follow-ups (from internal audit, parked)

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| KES-12 | No CI pipeline | Medium | **Open** — suites exist and pass locally; a GitHub Actions workflow would run them on every push |
| KES-13 | Webhook records the Stripe event before processing | Low | Open — a transient handler error could drop a confirmation; idempotent + recoverable in practice |
| KES-14 | `release_payment` doesn't check `payouts_enabled` | Low | Open — could strand escrow on a half-onboarded writer |
| KES-15 | Duplicate cased UI components (`Button.jsx`/`button.jsx`, …) | Low | Open — portability risk on case-insensitive filesystems |
| KES-16 | Throttle 429 message is English (DRF default) | Low | Open — cooldown UI means users rarely see it |

## Notable QA insight — the "works on my machine" class

KES-01, KES-02 and KES-03 share a root cause worth recording: **development and
production take different code paths**, so a production-only layer (Render's SMTP
block, Django's response headers on the served SPA, template escaping in real
emails) stayed invisible until the feature was tested **on the live deployment**.
This drove the Sprint 2 retrospective action to test every feature on Render, not
just locally.
