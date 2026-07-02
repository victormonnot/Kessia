# Kessia — MVP Development & Sprint Documentation

Development-phase documentation for the Kessia MVP (state of `dev`, 02 Jul 2026).
Previous stages: [Team Formation & MVP (Stage 1)](<Team%20Formation,%20Brainstorming%20and%20MVP%20(Stage%201).md>) ·
[High-Level Plan](High-LevelPlan.md) · [Technical Documentation (Stage 3)](<Technical_Documentation_(Stage_3).md>) ·
meeting notes in [`Meetings/`](Meetings).

## Project Overview

Kessia is a two-sided marketplace for medical and scientific writing: it connects
doctors and health institutions with freelance scientific writers. A single
account is a doctor (buyer) by default and can activate a writer profile.

- Backend: Django 5 (LTS) + Django REST Framework, Django Channels (WebSockets), PostgreSQL.
- Frontend: React 18 + Vite + Tailwind CSS (single-page app, French-only UI).
- Payments: Stripe Connect (test mode) with writer payouts.
- External services: Brevo (transactional email), Google Identity (OAuth sign-in).
- Deployment: Docker Compose locally; a single Render web service + Neon PostgreSQL for staging.

Repository: <https://github.com/victormonnot/Kessia> — code on `dev` → `main`,
documentation on `technical_doc`.
Staging: <https://kessia-j1mk.onrender.com> · API docs: <https://kessia-j1mk.onrender.com/api/docs/>
Architecture diagram: [`Architecture Diagram.png`](<Architecture%20Diagram.png>)

## MVP Goal

- Deliver a functional platform where writers publish listings, doctors publish
  requests, and orders run through a complete lifecycle: acceptance, work,
  delivery, completion.
- Move real money: card payment once the writer accepts, funds held by the
  platform, writer paid out (minus a 15 % commission) at completion.
- Build trust: real-time messaging, reviews gated to completed orders, a
  verified-writer badge, and an admin back office (moderation, reports, refunds).
- Respect the legal frame: consent at signup, cookie banner, and account
  deletion by anonymisation (RGPD).

## Team & Roles

| Member | Role | Responsibilities |
|--------|------|------------------|
| Soumia Taoui | Product Owner & Sponsor | Backlog priorities, acceptance, domain expertise |
| Yasi Philippe Hübner | Backend Lead | Backend & database, SCM (branches, PR reviews, merges), deployment, security |
| Victor Monnot | Frontend Lead | Frontend SPA, UI/UX, QA coordination |

QA and bug-fixing are shared between the two developers. Sprint planning and
deadline tracking are arbitrated with the Product Owner at regular in-person
meetings.

## Sprint Planning

### Methodology: MoSCoW

| Priority | Scope |
|----------|-------|
| Must Have | Dual-role accounts, JWT authentication, listings catalogue, orders and their status machine, requests board with atomic proposal acceptance, dashboards, responsive French UI |
| Should Have | Real-time messaging, gated reviews, verified-writer badge, lifecycle emails, full account lifecycle (reset, email verification, change/delete), RGPD consent, rate limiting |
| Could Have | Chat attachments, Google sign-in, Brevo email delivery, rich writer profiles, favorites |
| Won't Have (v1) | i18n / multi-currency, SMS, real third-party credential verification, AI writing assistant |

Online payment was initially out of MVP scope. The core landed ahead of the
High-Level Plan schedule, so a third build sprint brought Stripe Connect and the
admin back office into scope, with the Product Owner informed at each review.

### Sprint structure

- Duration: about two weeks per sprint, paced to the Product Owner review meetings.
- Tools: GitHub (branches, pull requests, issues), shared Google Drive, in-person meetings.
- Ceremonies: Monday planning sync, short daily stand-ups, a Thursday unblock
  point, then review with the PO and a team retrospective at the end of each sprint.

### Schedule

| Sprint | Dates | Theme | Review |
|--------|-------|-------|--------|
| 0 | Apr 27 – May 25 | Inception & technical documentation | Meetings 1 & 2 |
| 1 | May 26 – Jun 1 | Core MVP build | Meeting 3 (02 Jun) |
| 2 | Jun 2 – Jun 16 | Hardening, trust & safety, staging deployment | Meeting 4 (16 Jun) |
| 3 | Jun 17 – Jun 26 | Payments, administration, production hardening | Meeting of 30 Jun |
| Closure | Jul 6 – Jul 17 | Demo, slides, dry-runs, technical review | Final presentation (17 Jul) |

**Sprint 0** locked the scope and produced a build-ready specification: charter,
MoSCoW user stories, wireframes, system architecture, database schema and API
contract. The tech stack pivoted from FastAPI to Django on 06 May, before any
feature code was written.

**Sprint 1** built the core marketplace end to end: authentication (JWT with
httpOnly refresh cookie), listings CRUD and catalogue, the order status machine
with deliverable upload/download, the requests board with atomic proposal
acceptance, real-time messaging, reviews, the badge flow, dashboards, and a
one-command Docker stack with a seeded demo dataset.

**Sprint 2** made the product deployable: password reset, email verification,
change email/password, account deletion, Google sign-in, consent and cookie
banner, read-only mode for unverified accounts, rate limiting, upload limits,
chat attachments, Brevo email delivery, the "La Revue" visual identity, rich
writer profiles with favorites, and the first Render deployment.

**Sprint 3** made the marketplace real: Stripe Connect payments (card payment
after acceptance, funds held, payout minus the 15 % fee at completion, automatic
refund on decline or cancel, idempotent webhooks), embedded Stripe Express
onboarding for writers, a complete admin back office (statistics, user and
content moderation with restore, order refunds, user reports, audit log),
account deletion reworked as RGPD anonymisation, and a second security pass
(session revocation on password change, chat rate limit, gated API docs,
dependency updates to Django 5.2 LTS).

## Development

### Backend

Eleven Django apps behind a versioned REST API (`/api/v1/`) plus a WebSocket
endpoint for messaging:

| App | Responsibility |
|-----|----------------|
| `users` | Dual-role user, JWT + Google authentication, account lifecycle, writer profiles, RGPD deletion |
| `listings` | Writer listings, public catalogue with filters, search and pagination |
| `requests_board` | Doctor requests, writer proposals, atomic acceptance that creates the order |
| `orders` | Order status machine, secure deliverable exchange, payment state |
| `payments` | Stripe Connect: onboarding, checkout, webhooks, transfers, refunds |
| `messaging` | Conversations, REST history + WebSocket delivery, attachments, unread tracking |
| `reviews` | One review per completed order, aggregated on profiles and listings |
| `verification` | Verified-writer badge requests reviewed by an administrator |
| `favorites` | Saved listings and requests |
| `admin_panel` | Staff-only moderation API with an append-only audit log |
| `common` | Shared permissions, throttles, upload validation, notifications, demo seed |

The data model counts 17 models. Key decisions:

- The order is the hub: it originates from a listing purchase or an accepted
  proposal; the amount and writer are snapshotted at creation so the engagement
  never depends on a later edit.
- Workflow status (`pending → accepted → in_progress → delivered → completed`)
  and payment status (`unpaid → processing → held → released / refunded`) are two
  separate state machines that gate each other.
- One review per order (one-to-one), only on completed orders.
- Conversations store a canonical user pair to prevent duplicate threads.
- Moderation is soft and audited: content is removable and restorable, and every
  admin action is written to the audit log.
- Processed Stripe webhook events are recorded so replays never move funds twice.

### Frontend

React SPA with client-side routing and code splitting: landing, catalogue and
listing pages, requests board, doctor and writer dashboards, inbox with
real-time conversations, public profiles, favorites, settings (profile,
security, payments), guided onboarding, authentication pages, payment status
page, legal pages — plus a nine-page admin interface behind staff-only routes.
Server state is cached with TanStack Query; authentication lives in a minimal
Zustand store; Axios refreshes the session silently on 401.

### SCM & QA

- Branch strategy: `feature/*` and `fix/*` → pull request review → `dev` → `main`.
  Documentation lives on `technical_doc`.
- Every PR is reviewed by the other developer before merge; commits follow
  Conventional Commits, so the history doubles as a changelog.
- Definition of Done: tests and linters green (`pytest`, `vitest`, `ruff`,
  `ESLint`), behaviour verified against acceptance criteria — including on the
  deployed environment for anything touching deployment-only layers.

## Monitoring Progress

Daily in-person stand-ups (done since last, plan for today, blockers), a weekly
Monday sync with the Product Owner, and a Thursday mid-week unblock point.
GitHub pull requests serve as the objective log of delivered work.

| Sprint | Delivered | Planned vs. completed |
|--------|-----------|------------------------|
| 0 | 6 documentation deliverables | 100 % — specification signed off by the PO |
| 1 | ~25 features | ~100 % — all Must Have and the Should Have core |
| 2 | ~18 features and fixes | ~100 % — lifecycle, trust & safety, deployment |
| 3 | ~20 features and fixes | ~100 % — payments, back office, security pass |

Adjustments along the way:

- Could Have items (Google sign-in, chat attachments, Brevo) were pulled forward
  into Sprint 2 once the core landed early; payments and administration extended
  the scope in Sprint 3.
- Meeting 3 found the UI "too monotone", which became the Sprint 2 restyle.
- Checkout was restricted to card payments after a risk analysis: bank-debit
  methods can be reversed for weeks while the writer payout is immediate and
  irreversible. The residual card-chargeback risk is accepted and documented.
- Specialty and paper-type taxonomies were corrected when the PO supplied the
  definitive domain lists.

## Sprint Reviews & Retrospectives

### Reviews

- **Sprint 0** (Meetings of 05 and 19 May): scope, user stories, mockups and the
  dual-publishing model presented; colour pattern and badge approach validated;
  specification accepted — green light for the build.
- **Sprint 1** (02 Jun): full V1 demo, from signup to review, including real-time
  messaging and the badge flow. V1 accepted. Feedback: revise the visual
  identity, personalise offer cards, rework the landing copy.
- **Sprint 2** (16 Jun): V2 demo with the new identity (validated), complete
  taxonomies, hardened account lifecycle, Brevo delivery, Google sign-in, and
  the staging deployment handed to the PO for third-party feedback. Next
  meeting set for 30 Jun.
- **Sprint 3** (30 Jun): full payment lifecycle on Stripe test mode, admin back
  office, RGPD deletion and the security pass. Meeting notes to be added.

### Retrospective

| Topic | Notes |
|-------|-------|
| What went well | Parallel back/front work over an agreed API contract; Django/DRF conventions gave permissions, serialisation and pagination almost for free; the test suite acted as a merge gate and let every hardening change ship behind green builds. |
| What was difficult | Deployment-only failures invisible in local dev (blocked SMTP, response headers breaking the Google popup, static and media serving); payments multiplied the failure modes to reason about (webhook replays, refunds after payout, reversible payment methods); Channels/ASGI added moving parts beyond plain REST. |
| What we improved | Every feature is now also tested on the deployed environment; idempotency became a design rule for anything that moves money; risk decisions are written down when taken; the demo seed can rebuild any environment in one command. |

## Final Integration & QA Testing

Backend tests run with pytest against the same PostgreSQL engine used at
runtime, so row-locking and constraints are genuinely exercised; the Google and
Stripe SDKs are mocked, and webhook idempotency is tested by replaying events.
Frontend pages, forms and hooks are tested with Vitest and Testing Library.
Manual API testing used Postman and the Swagger UI; payments were verified by
hand with Stripe test cards.

Results (02 Jul 2026):

```
backend  $ pytest -q                240 passed
backend  $ ruff check apps/ config/ All checks passed!
frontend $ npm test -- --run        26 passed (16 files)
frontend $ npm run lint             no errors
```

The full journey was validated end to end, locally and on staging: register a
doctor and a writer, onboard the writer on Stripe, order (directly or through an
accepted proposal), pay by test card, chat in real time with an attachment,
deliver, complete (payout reaches the writer's Stripe balance), review, request
and approve the badge, then the admin path: report content, remove and restore
it, refund an order, check the audit log. Email delivery, Google sign-in and the
webhooks were verified on the deployed environment.

### Bug tracking

Bugs were tracked as GitHub issues and fixed on `fix/*` branches. All blocking
bugs were resolved before the next review.

| ID | Bug | Severity | Fix |
|----|-----|----------|-----|
| KES-01 | Emails never delivered once deployed (Render blocks outbound SMTP) | Critical | Send through the Brevo HTTPS API (django-anymail) |
| KES-02 | Email links corrupted by template auto-escaping (`&` → `&amp;`) | High | Disabled auto-escaping in the plain-text email templates |
| KES-03 | Google sign-in popup blank in production (COOP header) | High | `SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"` |
| KES-04 | Brevo rejected all sends (authorised-IP setting vs. dynamic Render IP) | High | Disabled the IP restriction; key kept in env vars |
| KES-05 | `DEFAULT_FROM_EMAIL` rejected (malformed sender) | Medium | Corrected to the `Name <email>` format |
| KES-06 | Unbounded file uploads | Medium | Shared validator: size caps, extension allowlist, later content checks |
| KES-07 | Backend container missing provider env vars | Medium | `env_file: .env` on the backend service |
| KES-08 | Logged-in users could reach `/login` and `/register` | Medium | `GuestRoute` guard |
| KES-09 | Stale error flashed while queries refetched | Low | Show the loading state while refetching |
| KES-10 | Demo login buttons failed (accounts not seeded) | Low | `seed_demo` creates verified demo accounts |
| KES-11 | Stale demo data after taxonomy change | Low | Re-seed after enum updates |
| KES-12 | Duplicate UI components differing only by case | Low | Merged into the lowercase files |
| KES-13 | App crashed at launch on Render (`collectstatic`) | Critical | Fixed the static-collection step in the Dockerfile |
| KES-14 | Uploaded media 404 in production without S3 | Medium | Serve `/media` from the single-origin service; S3 documented as the durable option |
| KES-15 | Unpublished listings visible to non-authors | Medium | Restrict drafts to their author, with regression tests |
| KES-16 | Password change left other sessions alive | Medium | Blacklist the user's other refresh tokens |
| KES-17 | Chat open to scripted flooding | Medium | Per-user message throttle (30/min) |
| KES-18 | API schema publicly exposed in production | Medium | Swagger gated behind `ENABLE_API_DOCS`, off by default |
| KES-19 | `seed_demo` failed when data already existed | Low | Made the command idempotent |

Open follow-ups: add a CI pipeline (GitHub Actions) to run the suites on every
push; configure S3-compatible storage for durable media on staging; rotate the
Brevo API key; localise the throttling error message.

## MVP Delivery Summary

| Feature | Status |
|---------|--------|
| Authentication (JWT, Google sign-in, full account lifecycle) | Delivered |
| Listings catalogue, search and filters | Delivered |
| Requests board with proposals and atomic acceptance | Delivered |
| Orders, status machine, secure deliverables | Delivered |
| Payments — Stripe Connect, held funds, payouts, refunds (test mode) | Delivered |
| Real-time messaging with attachments | Delivered |
| Reviews and verified-writer badge | Delivered |
| Public profiles and favorites | Delivered |
| Admin back office (moderation, reports, refunds, audit log) | Delivered |
| RGPD: consent, cookie banner, deletion by anonymisation | Delivered |
| Rate limiting and security hardening | Delivered |
| Staging deployment (Render + Neon) | Delivered |

## Next Steps

- Closure phase: demo script, presentation slides, dry-runs, technical manual review.
- Add the meeting notes of 30 Jun to `Meetings/`.
- CI pipeline, durable media storage and the remaining follow-ups listed above.

## Installation & Setup

Requirements: Docker + Docker Compose. Configuration comes from a single `.env`
file (see `.env.example`): PostgreSQL credentials, `DJANGO_SECRET_KEY`, CORS and
cookie settings, `REDIS_URL`, Stripe test keys (`STRIPE_SECRET_KEY`,
`STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`), the Google OAuth client ID
and, in production, `BREVO_API_KEY`.

```bash
git clone https://github.com/victormonnot/Kessia && cd Kessia
cp .env.example .env
docker compose up --build
docker compose exec backend python manage.py seed_demo
```

`seed_demo` is idempotent and creates three demo accounts (password `demo1234`):
`doctor@kessia.demo`, `writer@kessia.demo` and `admin@kessia.demo`.

```bash
docker compose exec backend pytest -q
docker compose exec frontend npm test -- --run
docker compose exec backend ruff check apps/ config/
docker compose exec frontend npm run lint
```

| Service | URL |
|---------|-----|
| Frontend (local) | <http://localhost:5173> |
| API docs / Swagger (local) | <http://localhost:8000/api/docs/> |
| Django admin (local) | <http://localhost:8000/admin/> |
| Staging | <https://kessia-j1mk.onrender.com> |
| Staging API docs | <https://kessia-j1mk.onrender.com/api/docs/> |

## Resources

- [Django documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/)
- [Stripe Connect — separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [TanStack Query](https://tanstack.com/query/latest)

---

© 2026 — Kessia. Victor Monnot · Yasi Philippe Hübner · Soumia Taoui.
