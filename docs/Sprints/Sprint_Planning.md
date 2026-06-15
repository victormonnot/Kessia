# Kessia — Sprint Planning

> Companion to [`High-LevelPlan.md`](../High-LevelPlan.md) (programme timeline) and
> [`Technical_Documentation_(Stage_3).md`](<../Technical_Documentation_(Stage_3).md>)
> (user stories, architecture, DB). This document breaks the MVP-development phase
> into iterations, prioritises the backlog with **MoSCoW**, and assigns owners,
> deadlines and dependencies.

---

## 1. Team & roles

| Member | Primary role | Secondary responsibilities |
|--------|--------------|-----------------------------|
| **Soumia Taoui** | Product Owner & Project Sponsor | Backlog prioritisation, acceptance/sign-off, domain expertise, stakeholder liaison |
| **Yasi Philippe Hübner** | Backend Lead | SCM (branching, PR reviews, merges), deployment & DevOps, security |
| **Victor Monnot** | Frontend Lead | QA coordination, UI/UX, design system |

> The two developers **share QA and bug-fixing** (as set in the High-Level Plan).
> Roles like SCM and QA are not full-time positions in a two-developer team; the
> table records who *owns* each concern.

## 2. Working model

- **Iteration length:** 2-week sprints, paced to the bi-weekly Product Owner review.
- **Ceremonies:**
  - *Sprint Planning* — Monday weekly sync: pull and estimate the sprint backlog.
  - *Daily stand-up* — async on the WhatsApp group + a Thursday mid-week unblock call
    (see [`Progress_Tracking.md`](Progress_Tracking.md)).
  - *Sprint Review* — demo to the PO at the end-of-cycle meeting
    (see [`Sprint_Reviews.md`](Sprint_Reviews.md) and the [`Meetings/`](../Meetings) notes).
  - *Retrospective* — team-only, right after each review
    (see [`Retrospectives.md`](Retrospectives.md)).
- **Tooling:** GitHub (code + PR reviews + issues), Trello (task board), shared
  Google Drive (docs), WhatsApp (sync + PO communication).

## 3. Branching & Definition of Done

Branching follows the model declared in the Technical Documentation:

```
feature/* , fix/*  ──PR──▶  dev  ──PR──▶  main (production)
technical_doc        (documentation lineage, this branch)
```

A task is **Done** when:

1. Code is on a feature/fix branch, peer-reviewed via PR, and merged into `dev`.
2. Conventional-commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
3. Backend tests (`pytest`) and frontend tests (`vitest`) pass; `ruff` + `ESLint` clean.
4. The behaviour is verified manually against its acceptance criteria.
5. For Should/Could items: the PO has accepted it at a review.

---

## 4. MoSCoW backlog

Derived from the [user stories](<../Technical_Documentation_(Stage_3).md#1-user-stories>)
and refined with PO feedback across the three meetings.

### Must Have — the core two-sided marketplace
- Dual-role accounts (doctor by default, writer activation), JWT auth, log in/out.
- Listings CRUD + public catalogue with filter/search/pagination.
- Orders: placement + status machine (`pending → accepted | declined → … → completed`).
- Requests board: doctors post, writers submit proposals, atomic acceptance → order.
- Role dashboards (doctor / writer) and public writer profiles.
- Mobile-responsive, French-only UI.

### Should Have — trust, money, communication
- Stripe Connect payments with escrow (release on completion, auto-refund on cancel).
- In-platform messaging (REST history + real-time delivery).
- Reviews gated to completed orders, aggregated onto profiles & listings.
- Verified-writer badge (credential submission → admin approval).
- Transactional email notifications for the order lifecycle.
- Account lifecycle: password reset, **email verification**, change email/password, delete account.
- Trust & safety: CGU/consent at signup + cookie banner (RGPD), unverified read-only mode, rate-limiting.

### Could Have — convenience & polish
- File attachments in chat (with image/PDF preview).
- "Sign in with Google" (OAuth).
- Production email delivery via a transactional provider (Brevo).

### Won't Have (v1)
- i18n / multi-currency / tax compliance.
- SMS notifications.
- Real third-party credential verification (SIREN/Meta API) — the badge is admin-gated.
- Local AI assistant for writers (noted by PO as post-MVP — see Meeting 3).

---

## 5. Sprint breakdown

### Sprint 0 — Inception & Technical Documentation · **Apr 27 – May 25**
*Goal: lock scope and produce a build-ready technical specification.*

| Task | Owner | Dependency |
|------|-------|------------|
| Team formation, charter, problem statement, MVP scope | All | — |
| User stories + MoSCoW prioritisation | Victor | scope |
| Wireframes / mockup ([`MockupV1.html`](../MockupV1.html)) | Victor | user stories |
| **Tech-stack decision** (pivot FastAPI → Django, 06 May) | Yasi | — |
| System architecture diagram + ERD / DB schema | Yasi | tech stack |
| API & endpoint contract | Yasi + Victor | ERD |
| Risks & ethics (ICMJE/COPE, PHI policy) | Victor | — |
| Sign-off | Soumia | all of the above |

**Deliverable:** [`Technical_Documentation_(Stage_3).md`](<../Technical_Documentation_(Stage_3).md>).
**Reviews:** Meeting 1 (05 May), Meeting 2 (19 May) — early MVP shown.

---

### Sprint 1 — Core MVP build · **May 26 – Jun 1**
*Goal: a working end-to-end MVP demoable to the PO (all Must-Have + most Should-Have).*

**Backend (Yasi)**
- Dual-role `User`, JWT with refresh token in an httpOnly cookie + CSRF double-submit.
- `listings` CRUD + filtered/paginated public catalogue.
- `orders` status machine + deliverable upload/download + event emails.
- `requests_board`: proposals + **atomic** acceptance (`select_for_update`) → order.
- `payments`: Stripe Connect (pay-after-accept, escrow, release/refund, idempotent webhooks).
- `messaging`: REST conversations + real-time delivery (Django Channels).
- `reviews` (completed-order-gated) and `verification` (badge) apps.
- Search/sort/pagination; role dashboards; public writer profiles.

**Frontend (Victor)**
- Auth (react-hook-form + zod), catalogue, listing detail/form.
- Request board + proposals; doctor/writer dashboards; order actions & payment modal.
- Reviews & public profile; messaging inbox + realtime conversation.
- Account settings, guided writer onboarding, landing, legal pages, 404, route code-splitting.

**Infra (Yasi)** — single-image Dockerfile; idempotent demo-seed command.

**Dependencies:** auth precedes everything; orders precede payments/reviews;
messaging realtime depends on the REST layer.

**Deliverable:** MVP **V1**. **Review:** Meeting 3 (02 Jun).

---

### Sprint 2 — Hardening, trust & safety, delivery · **Jun 2 – Jun 16**
*Goal: production-readiness — close the account lifecycle, harden security, ship to production.*

| Theme | Tasks | Owner |
|-------|-------|-------|
| Account lifecycle | Password reset, email verification + banner, change email/password, delete account, **Google OAuth** | Both |
| Trust & safety | CGU consent + cookie banner (RGPD), **unverified read-only mode** (RBAC), **rate-limiting** (anti-abuse), upload size/type limits | Both |
| Chat | File attachments + image/PDF preview | Both |
| Email delivery | **Brevo HTTPS API** (Render blocks SMTP), template fixes | Yasi |
| Production | Render single-origin deploy, Neon Postgres, COOP fix for OAuth popup | Yasi |
| Domain content | Specialty taxonomy + paper-type taxonomy (PO-sourced) | Both |
| UI | "La Revue" restyle | Victor |

**Deliverable:** production deployment at <https://kessia-j1mk.onrender.com>.
**Review:** Meeting 16 Jun (with two field experts).

---

## 6. At-a-glance schedule

| Sprint | Dates | Theme | PO Review |
|--------|-------|-------|-----------|
| 0 | Apr 27 – May 25 | Inception & Tech Doc | Meetings 1 & 2 |
| 1 | May 26 – Jun 1 | Core MVP build | Meeting 3 (02 Jun) |
| 2 | Jun 2 – Jun 16 | Hardening & delivery | Meeting (16 Jun) |
| (Closure) | Jul 6 – Jul 17 | Demo, slides, dry-runs, final MR | Final presentation (17 Jul) |
