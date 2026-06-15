# Kessia — QA & Testing

> The development workflow (SCM + QA), the test strategy, the **evidence and
> results**, and the final integration / end-to-end pass. Bugs found are logged in
> [`Bug_Tracking.md`](Bug_Tracking.md).

---

## 1. Development workflow (SCM)

- **Branching:** `feature/*` and `fix/*` branches → PR review → `dev` → PR → `main`.
  Documentation lives on the `technical_doc` branch.
- **Code review:** every PR is reviewed by the other developer before merge; the
  Backend Lead owns SCM (merge discipline, conflict resolution).
- **Commit hygiene:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`) — the history doubles as a changelog (see
  [`../Sprints/Progress_Tracking.md`](../Sprints/Progress_Tracking.md)).
- **Quality gate:** a task is not "Done" while tests or linters are red.

## 2. Test strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Backend unit & integration | **pytest** + DRF `APIClient` | Endpoints, permissions, status transitions, auth, throttling, uploads |
| Backend fixtures | **factory_boy** | Deterministic model creation |
| Backend DB | **PostgreSQL** (not SQLite) | Real row-locking exercised (`select_for_update` for atomic proposal acceptance) |
| External services in tests | **mocks** | The Google token verifier is mocked — no network, no live calls |
| Frontend components/hooks | **Vitest** + Testing Library | Pages, forms, hooks, user interactions |
| Manual API testing | **Postman** / Swagger UI (`/api/docs/`) | Auth flows and edge cases |
| Code quality | **ruff** (backend), **ESLint** (frontend) | Linting / static checks |

**Why these choices** — tests run against the *same* PostgreSQL used at runtime, so
DB-specific behaviour (locking, constraints, indexes) is genuinely tested rather
than approximated by SQLite. Third-party SDKs are mocked so the suite is fast,
offline and deterministic.

## 3. Test evidence & results (end of Sprint 2)

```
backend  $ pytest -q
161 passed

backend  $ ruff check apps/ config/
All checks passed!

frontend $ npm test -- --run
Test Files  15 passed (15)
     Tests  22 passed (22)

frontend $ npm run lint
(no errors)
```

**Representative backend coverage by app**

| App | Example assertions tested |
|-----|----------------------------|
| `users` | Register sets httpOnly refresh cookie; password reset is non-enumerating; email-verify token is single-use; change-email re-unverifies; **Google login** creates a verified, password-less user and links by email; consent timestamp recorded |
| `listings` / `requests_board` | CRUD permissions; only writers create listings/proposals; **email-unverified users are blocked from writes (403)** |
| `orders` | Status-machine transitions; only the writer delivers; deliverable download is access-gated; **upload size/type limits** reject bad files |
| `messaging` | Conversation dedup; first-unread-only email; attachment download gated to participants; unverified users **read but cannot send** |
| `reviews` / `verification` | Reviews gated to completed orders; verification document size/type limits |
| `common` (cross-cutting) | Email-gating matrix; rate-limit thresholds (login, register, password-reset, resend, change-email) |

## 4. Final integration & end-to-end QA

Beyond unit tests, the MVP was validated as a whole — both via the documented
manual end-to-end script and by exercising the **live staging deployment**.

**Manual end-to-end script (executed):**
1. Register a doctor; activate writer mode on a second account.
2. Doctor sends a pre-sales message (conversation with no order).
3. Doctor discovers a writer via search, or posts a request and accepts a proposal
   → an order is created.
4. Writer accepts the order → status `in_progress`.
5. Both parties chat live (WebSocket).
6. Writer uploads a deliverable; doctor downloads it and confirms completion →
   status `completed`.
7. Doctor reviews the completed order → rating appears on the writer's profile.
8. Writer requests verification → admin approves → "Vérifié" badge appears.
9. Verify event emails arrive, the mobile layout holds, and the suite is green.

**Staging / cross-environment QA (Render):**
- Front-end ↔ back-end integration verified on the live origin (same-domain API).
- **Email delivery** confirmed end-to-end through Brevo (signup verification +
  password reset arriving in a real inbox).
- **Google sign-in** verified on the deployed domain (popup → token → session).
- Browser tooling (DevTools Network/console, response-header inspection) used to
  diagnose deployment-only issues — see the "works on my machine" entries in
  [`Bug_Tracking.md`](Bug_Tracking.md).

**Tools:** pytest, Vitest, Postman, Swagger UI, Chrome DevTools, `curl` (header checks),
Render logs.
