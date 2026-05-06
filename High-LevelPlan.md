## High-Level Plan

This section maps the major phases of the **Kessia** capstone project from team formation to final delivery. The project runs over **~12 weeks**, from the start of team formation (April 27, 2026) to the final presentation (July 17, 2026).

### Project Stages Overview

| Stage | Phase | Period | Status |
|-------|-------|--------|--------|
| 1 | Idea Development | Apr 27 – May 3 (Week 1) | Completed |
| 2 | Project Planning | Apr 27 – May 3 (Week 1) | Completed |
| 3 | Technical Documentation | May 4 – May 25 (Weeks 2–4) | In progress |
| 4 | MVP Development | May 26 – Jul 5 (Weeks 5–10) | Upcoming |
| 5 | Project Closure | Jul 6 – Jul 17 (Weeks 11–12) | Upcoming |

### Timeline & Key Milestones

| Week | Dates | Stage | Key Milestones / Deliverables |
|------|-------|-------|-------------------------------|
| 1 | Apr 27 – May 3 | Idea Dev. + Project Planning | Team formation, problem statement, MVP scope locked, project charter (Trello, roles, communication plan) |
| 2 | May 4 – May 10 | Technical Documentation | User stories, user flows, wireframes (low-fi), tech stack justification |
| 3 | May 11 – May 17 | Technical Documentation | ERD / database schema, URL routing plan, system architecture diagram |
| 4 | May 18 – May 25 | Technical Documentation | API/REST endpoints contract (frontend ↔ backend), risks & ethics doc finalized, **Tech Doc submission (May 25)** |
| 5 | May 26 – May 31 | MVP Development | Project bootstrap (Django + PostgreSQL backend, React + Tailwind frontend), auth scaffolding, dual-role user model |
| 6 | Jun 1 – Jun 7 | MVP Development | Sign-up flows (medical pro / writer), profile basics, admin tooling (e.g. SQLAdmin) |
| 7 | Jun 8 – Jun 14 | MVP Development | Service listings CRUD (writers create/edit/delete), public listings page |
| 8 | Jun 15 – Jun 21 | MVP Development | Service detail page, order placement form, notification logic |
| 9 | Jun 22 – Jun 28 | MVP Development | End-to-end integration, basic styling pass, seed data |
| 10 | Jun 29 – Jul 5 | MVP Development | Bug fixing, manual QA, deployment to Railway/Render, README polish |
| 11 | Jul 6 – Jul 12 | Project Closure | Demo script, slide deck, final testing, dry-run presentations |
| 12 | Jul 13 – Jul 17 | Project Closure | **Final presentation (Jul 17)**, repo cleanup, retrospective |

### School Deliverable Deadlines

- **Apr 27 – May 3:** Portfolio Project — Team Formation, Brainstorming & MVP + Project Planning
- **May 4 – May 25:** Portfolio Project — Technical Documentation
- **Jul 17:** Final project deadline & presentation

### Task Split (Victor & Yasi)

Since we are a 2-person team, work is split by feature/layer ownership while keeping pair-work moments for risky or cross-cutting parts.

**Stage 3 — Technical Documentation (May 4 – May 25)**

| Owner | Responsibilities |
|-------|------------------|
| Victor | User stories, user flows, wireframes, ethics & risks section (ICMJE / COPE) |
| Yasi | Tech stack rationale, system architecture diagram, ERD / database schema, deployment plan |
| Both | Final review pass, README integration, MVP scope validation |

**Stage 4 — MVP Development (May 26 – Jul 5)**

| Owner | Responsibilities |
|-------|------------------|
| Victor (frontend lead) | React app setup (Vite + Tailwind), routing, sign-up/login UI, listings browse page, service detail page, order placement form, API integration |
| Yasi (backend lead) | Django project setup, PostgreSQL schema, dual-role auth & user models, listings & orders models, admin tooling, deployment (Railway/Render) |
| Both | Integration points (order notification flow), seed data, manual QA, bug-fixing sprints |

**Stage 5 — Project Closure (Jul 6 – Jul 17)**

| Owner | Responsibilities |
|-------|------------------|
| Victor | Demo script, slide deck (product sections), presentation rehearsal |
| Yasi | Final deployment, demo data, slide deck (technical sections) |
| Both | Final dry-runs, retrospective, repo & documentation cleanup |

### Working Cadence

- **Weekly sync:** Monday — review last week, plan current week, update Trello board
- **Mid-week check-in:** Thursday — unblock issues, adjust scope if needed
- **Tooling:** Trello (tasks), GitHub (code + PR reviews), shared Google Drive (docs)
- **Branching:** feature branches → PR review by the other teammate before merge to `main`
