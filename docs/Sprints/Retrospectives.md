# Kessia — Sprint Retrospectives

> Team-only reflection after each Sprint Review. Format: *What went well · What
> was challenging · What we'll change next sprint.* Action items are carried into
> the next [`Sprint_Planning.md`](Sprint_Planning.md).

---

## Sprint 0 Retrospective — Inception & Tech Doc

**What went well**
- Early, regular alignment with the PO (in-person meetings) kept scope tight.
- The **FastAPI → Django** pivot (06 May) was made *before* any feature code — a
  cheap decision at the right time, justified by Django's batteries-included ORM,
  admin and DRF.
- The ERD and API contract were agreed before coding, which made Sprint 1 fast.

**What was challenging**
- The Gantt chart needed several iterations to render correctly on GitHub
  (multiple `fix: Gantt` commits) — time lost to a presentation detail.
- Balancing documentation depth against the looming build phase.

**What we changed**
- Froze the diagrams once "good enough" instead of polishing endlessly.
- Wrote the user stories in MoSCoW form so the build sprint could pull by priority.

---

## Sprint 1 Retrospective — Core MVP

**What went well**
- Clean **back/front split** let both developers work in parallel with few merge
  conflicts; the agreed API contract was the integration glue.
- Building on Django/DRF conventions meant auth, permissions, serialisers,
  filtering and pagination came largely "for free" — huge velocity.
- Test-first discipline on the backend (permissions, status transitions)
  caught regressions immediately.

**What was challenging**
- The scope landed in one intense burst — risky if either developer had stalled.
- Real-time messaging (Channels/ASGI) added moving parts (Daphne, channel layer)
  beyond plain DRF.
- Keeping the frontend's `choices` mirror in sync with the backend enums was manual.

**What we changed**
- Adopted a shared "Definition of Done" (tests + lint + PR review) to keep the
  burst from accumulating debt.
- Agreed to harden and document in Sprint 2 rather than mid-burst.

---

## Sprint 2 Retrospective — Hardening & Delivery

**What went well**
- The earlier investment in tests paid off: every hardening change (rate-limits,
  read-only gating, upload limits) shipped behind green suites (161 backend tests).
- Reusable building blocks (a single `IsEmailVerified` permission, one shared
  upload validator, one throttle module) kept the security work consistent.
- Debugging the deployed environment was methodical: we read the **actual error** (Render logs,
  live header inspection) instead of guessing.

**What was challenging — the "works on my machine" gap**
Several issues were **invisible locally** because dev and the deployed environment take different paths:
- **Render blocks outbound SMTP** → emails timed out once deployed though they
  worked from a laptop. Fixed by sending via the **Brevo HTTPS API**.
- Django's default **`Cross-Origin-Opener-Policy: same-origin`** left the Google
  sign-in popup blank once deployed (Vite served the dev page without that header).
- Template **auto-escaping** turned `&` into `&amp;` in email links, breaking them.
- Brevo's **IP-authorisation** security setting silently blocked sends.

**What we changed**
- Made it a rule to **test every feature on the deployed Render site**, not just
  locally — the layers that only exist once deployed (proxy, headers, port policy,
  static serving) need their own pass.
- Moved provider secrets to environment variables and forwarded `.env` into the
  backend container so local and the deployed environment read configuration the same way.

**Carry-over / known follow-ups** (tracked from the internal audit)
- Add a CI pipeline (GitHub Actions) to run the existing suites on every push.
- De-duplicate the legacy/cased UI components.
- Regenerate the Brevo API key (it transited a debugging session).
