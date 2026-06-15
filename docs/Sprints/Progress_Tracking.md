# Kessia — Progress Tracking & Metrics

> How we monitored progress, ran stand-ups, and measured velocity across the
> sprints defined in [`Sprint_Planning.md`](Sprint_Planning.md).

---

## 1. Stand-up cadence

A two-person developer team favoured short, frequent **in-person syncs**:

- **Daily sync** — the two developers met briefly (in person) to share *what
  shipped, what's in progress, any blocker.* PRs on GitHub serve as the living
  "done" log.
- **Monday weekly sync** (with the PO) — review the previous week, plan the current
  one.
- **Thursday mid-week unblock** — the two developers clear blockers and re-balance
  scope if a task is slipping.

Each stand-up answers the three standard questions: *Done since last? Plan for
today? Blockers?*

## 2. Tracking tools

| Tool | Use |
|------|-----|
| **GitHub** | Branches, Pull Requests (peer review), Issues for task & bug tracking |
| **GitHub commit history** | Objective record of delivered work (Conventional Commits) |
| **Local test suites (`pytest` / `vitest` / linters)** | Quality gate — a task isn't "Done" while red |

## 3. Velocity

Because the early sprint was documentation-heavy and the build sprints were
feature-heavy, we track velocity in **delivered work items** (merged PRs / shipped
features) rather than abstract story points — a more honest signal for a small team.

| Sprint | Theme | Delivered items | Notes |
|--------|-------|-----------------|-------|
| Sprint 0 | Inception & Tech Doc | 6 documentation deliverables | Charter, user stories, wireframes, architecture, ERD, API contract |
| Sprint 1 | Core MVP build | **~25 features** | Entire backend (8 apps) + full SPA, in one intensive cycle |
| Sprint 2 | Hardening & delivery | **~18 features/fixes** | Account lifecycle, security, email delivery, OAuth, restyle, deploy |

> Sprint 1's burst reflects parallel back/front tracks landing together for the
> V1 demo. Sprint 2 settled into a steadier hardening rhythm.

## 4. Planned vs. completed

| Sprint | Planned scope | Completed | % |
|--------|---------------|-----------|---|
| 0 | Full technical specification | Delivered & PO-signed | 100% |
| 1 | All Must-Have + Should-Have core | Delivered (messaging, reviews, verification all in) | ~100% |
| 2 | Should-Have lifecycle + Could-Have polish + deployment | Delivered; **deployed to staging** | ~100% |

Notably, several **Could-Have** items (chat attachments + preview, Google OAuth,
Brevo transactional email) were pulled forward and completed — the team ran **ahead**
of the High-Level Plan, which had MVP development scheduled through Jul 5.

## 5. Quality metrics (end of Sprint 2)

| Metric | Value |
|--------|-------|
| Backend automated tests (`pytest`) | **161 passing** |
| Frontend automated tests (`vitest`) | **22 passing** |
| Linters | `ruff` (backend) + `ESLint` (frontend) — **clean** |
| Django apps | 7 (`users, listings, orders, requests_board, reviews, messaging, verification`) + `common` |
| Logged bugs | see [`../QA/Bug_Tracking.md`](../QA/Bug_Tracking.md) |
| Bug resolution rate | 100% of logged bugs resolved before the next review |

## 6. Adjustments made mid-flight

- **Scope pull-forward:** with the core MVP done early (Sprint 1), the team pulled
  Could-Have items (OAuth, chat attachments, transactional email) into Sprint 2 instead
  of waiting for the closure phase.
- **Re-prioritisation after PO feedback:** Meeting 3 flagged the UI as "too
  monotone" → a dedicated restyle task was added to Sprint 2.
- **Taxonomy corrections:** specialty and paper-type lists were revised once the PO
  supplied the definitive domain lists (Sprint 2).
