# Kessia — Technical Documentation (Stage 3)

---

## Table of Contents

1. [User Stories](#1-user-stories)
2. [System Architecture](#2-system-architecture)
3. [Components, Classes & Database Design](#3-components-classes--database-design)
4. [Sequence Diagrams](#4-sequence-diagrams)
5. [API & Methods](#5-api--methods)
6. [SCM & QA Strategy](#6-scm--qa-strategy)
7. [Technical Justifications](#7-technical-justifications)

---

## 1. User Stories

Kessia has three actor types: **Writer** (activated writer mode), **Doctor / Institution** (default after sign-up), and **Admin** (platform operator). Stories are prioritized using **MoSCoW**.

### Must Have

| Area | Story |
|------|-------|
| Auth | As a visitor, I want to sign up with email and password. |
| Auth | As a registered user, I want to log in and out. |
| Auth | As a user, I want to activate writer mode to unlock listing creation. |
| Listings | As a writer, I want to create a listing with title, description, specialty, deliverable type, price, and turnaround. |
| Listings | As a writer, I want to edit or delete my listings. |
| Browse | As a doctor, I want to browse all published listings. |
| Browse | As a doctor, I want to filter listings by specialty and deliverable type. |
| Browse | As a doctor, I want to view a full service detail page including writer info. |
| Orders | As a doctor, I want to place an order from a service page. |
| Orders | As a doctor, I want to see my order ID and status after placing an order. |
| Orders | As a writer, I want to accept, decline, or mark an order as delivered. |
| Orders | As a doctor, I want to see the status of my orders (pending / accepted / declined / delivered). |
| Orders | As a writer, I want to see all orders linked to my listings with their statuses. |
| Requests | As a doctor, I want to post a writing request with topic, specialty, deadline, and budget. |
| Requests | As a writer, I want to browse open requests and submit a proposal. |
| UI | As any user, I want the platform to work on mobile. |

### Should Have

| Area | Story |
|------|-------|
| Dashboard | As a doctor, I want a dashboard showing all my orders and their statuses. |
| Dashboard | As a writer, I want a dashboard showing my listings and incoming orders. |
| Profile | As a doctor, I want to view a writer's public profile (bio, specialties, active listings). |
| Profile | As a writer, I want a public profile page to present my background and services. |
| Admin | As an admin, I want to view all registered users and their roles. |
| Admin | As an admin, I want to deactivate or remove a listing that violates platform terms. |
| Payments | As a doctor, I want to pay securely through the platform via Stripe. |
| Payments | As a writer, I want payments held in escrow and released upon delivery confirmation. |
| Messaging | As a doctor, I want to message a writer after placing an order. |
| Messaging | As a writer, I want to reply to client messages within the platform. |
| Badges | As a writer, I want to request a verified specialty badge by submitting my credentials. |
| Badges | As a doctor, I want to see verified badges on writer profiles and listings. |
| Badges | As an admin, I want to review badge requests and approve or reject them. |

### Could Have

| Area | Story |
|------|-------|
| Notifications | As any user, I want email notifications for key events (order placed, accepted, delivered). |

### Won't Have (v1)

- **International scaling** — i18n, multi-currency, and tax compliance are deferred until the model is validated.

---

### Mockup Screens

| Screen | Key Elements |
|--------|-------------|
| Landing | Value proposition, sign-up CTA |
| Registration | Email, password, profile fields, role selection |
| Login | Email + password |
| Listings Catalog | Listing cards (specialty, price, turnaround), filter sidebar |
| Service Detail | Full listing, writer info panel, "Place Order" CTA |
| Order Confirmation | Order summary, status badge |
| Writer Dashboard | Listings table, incoming orders with status + actions |
| Doctor Dashboard | Placed orders table with status tracking |
| Create / Edit Listing | Title, description, specialty, deliverable type, price, turnaround |

> Wireframes are available in [MockupV1.html](MockupV1.html).

---

## 2. System Architecture

Kessia is a three-tier application: a React SPA on the client, a Django REST API in the middle, and a PostgreSQL database for persistence. The full stack runs locally via Docker Compose.

![System Architecture Diagram](<Architecture Diagram.png>)

**Data flow in short:**
Client sends a request with a JWT token → Django validates it and routes to the correct app → the ORM reads or writes PostgreSQL → the result is serialised to JSON and returned to the frontend.

---

## 3. Components, Classes & Database Design

### 3.1 Frontend Pages

| Page | Route | Access | Purpose |
|------|-------|--------|---------|
| Landing | `/` | Public | Homepage with sign-up CTA |
| Register / Login | `/register` `/login` | Public | Account creation and login |
| Listings | `/listings` | Public | Browse writer service catalog |
| Listing Detail | `/listings/:id` | Public | Full offer + Place Order button |
| Listing Form | `/listings/new` `/listings/:id/edit` | Writer | Create or edit a listing |
| Requests | `/requests` | Public | Board of open writing requests |
| Request Detail | `/requests/:id` | Public | Full request + proposal form |
| Request Form | `/requests/new` | Authenticated | Post a writing request |
| Dashboard Writer | `/dashboard/writer` | Writer | My listings and incoming orders |
| Dashboard Doctor | `/dashboard/doctor` | Authenticated | My placed orders and statuses |

**Key UI components:** `ListingCard`, `ListingFilters`, `PlaceOrderModal`, `RequestCard`, `ProposalForm`, `OrderRow`, `StatusBadge`, `ProtectedRoute`, `WriterRoute`.

**State management:** Zustand stores auth tokens, TanStack React Query handles server data caching, Axios manages HTTP with automatic JWT refresh on 401.

---

### 3.2 Backend Apps (Django)

| App | Models | Responsibility |
|-----|--------|----------------|
| `users` | `User` | Auth, JWT, writer activation |
| `listings` | `Listing` | Service offers: CRUD + public catalog |
| `orders` | `Order` | Order placement and status transitions |
| `requests_board` | `Request`, `Proposal` | Reverse marketplace: doctors post, writers respond |

**User** — `email` (unique), `first_name`, `last_name`, `bio`, `is_writer` (role flag), `is_staff`, `date_joined`.

**Listing** — `writer` (FK), `title`, `description`, `specialty`, `deliverable_type`, `price`, `turnaround_days`, `is_published`.

**Order** — `listing` (FK, protected), `doctor` (FK), `status` (`pending → accepted | declined → delivered`), `message`.

**Request** — `doctor` (FK), `title`, `description`, `specialty`, `deadline`, `budget`, `status` (`open | closed`).

**Proposal** — `request` (FK), `writer` (FK), `message`, `price`, `status` (`pending → accepted | rejected`). One proposal per writer per request enforced at DB level.

---

### 3.3 Database Schema

```mermaid
erDiagram
    USER {
        bigint id PK
        varchar email UK
        varchar first_name
        varchar last_name
        text bio
        boolean is_writer
        timestamptz date_joined
    }
    LISTING {
        bigint id PK
        bigint writer_id FK
        varchar title
        varchar specialty
        varchar deliverable_type
        decimal price
        int turnaround_days
        boolean is_published
    }
    ORDER {
        bigint id PK
        bigint listing_id FK
        bigint doctor_id FK
        varchar status
        text message
    }
    REQUEST {
        bigint id PK
        bigint doctor_id FK
        varchar title
        varchar specialty
        date deadline
        decimal budget
        varchar status
    }
    PROPOSAL {
        bigint id PK
        bigint request_id FK
        bigint writer_id FK
        text message
        decimal price
        varchar status
    }

    USER ||--o{ LISTING : "writes"
    LISTING ||--o{ ORDER : "has"
    USER ||--o{ ORDER : "places"
    USER ||--o{ REQUEST : "posts"
    REQUEST ||--o{ PROPOSAL : "receives"
    USER ||--o{ PROPOSAL : "submits"
```

**Order status:** `pending → accepted | declined` then `accepted → delivered`

**Proposal status:** `pending → accepted | rejected`

---

## 4. Sequence Diagrams

### 4.1 Registration & Login

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant BE as Django API
    participant DB as PostgreSQL

    User->>FE: Fills registration or login form
    FE->>BE: POST /auth/register/ or /auth/login/
    BE->>DB: Check or create user
    DB-->>BE: User data
    BE-->>FE: Access token + refresh token
    FE->>FE: Token stored, user redirected
```

The access token expires after 15 minutes. Axios silently refreshes it in the background — the user is never interrupted.

---

### 4.2 Browse Listings & Place an Order

```mermaid
sequenceDiagram
    actor Doctor
    participant FE as Frontend
    participant BE as Django API
    participant DB as PostgreSQL

    Doctor->>FE: Opens listings page
    FE->>BE: GET /listings/
    BE->>DB: Fetch published listings
    DB-->>BE: Listing rows
    BE-->>FE: Listing cards
    FE->>FE: Renders catalog

    Doctor->>FE: Clicks Place Order
    FE->>BE: POST /orders/ with listing id
    BE->>DB: Insert order with status pending
    DB-->>BE: Order created
    BE-->>FE: Order confirmed
```

The catalog is public (no login required). Filters by specialty and deliverable type are supported.

---

### 4.3 Post a Request & Submit a Proposal

```mermaid
sequenceDiagram
    actor Doctor
    actor Writer
    participant FE as Frontend
    participant BE as Django API
    participant DB as PostgreSQL

    Doctor->>FE: Posts a writing request
    FE->>BE: POST /requests/
    BE->>DB: Insert request
    DB-->>BE: Request created
    BE-->>FE: Request confirmed

    Writer->>FE: Opens request and submits a proposal
    FE->>BE: POST /requests/id/proposals/
    BE->>DB: Insert proposal
    DB-->>BE: Proposal created
    BE-->>FE: Proposal confirmed
```

The requests board is public. Only writers can submit proposals. The doctor then reviews and accepts or rejects from their dashboard.

---

## 5. API & Methods

### 5.1 External APIs

No external API is used in the MVP. Planned integrations:

| Service | Purpose | Stage |
|---------|---------|-------|
| Stripe Connect | Payments and escrow | Should Have |
| SendGrid / Mailgun | Email notifications | Could Have |
| Twilio | SMS notifications | Could Have |

### 5.2 Internal Endpoints

All endpoints are prefixed `/api/v1/`. All payloads are JSON. Protected routes require `Authorization: Bearer <token>`. Interactive docs at `/api/docs/` (Swagger UI).

#### Auth & Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register/` | — | Create account, returns token pair |
| POST | `/auth/login/` | — | Login, returns token pair |
| POST | `/auth/refresh/` | Refresh token | Rotate tokens |
| POST | `/auth/logout/` | JWT | Blacklist refresh token |
| GET / PATCH | `/users/me/` | JWT | Get or update profile |
| POST | `/users/me/activate-writer/` | JWT | Enable writer mode |

#### Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings/` | — | Public catalog (filter, search, paginate) |
| POST | `/listings/` | Writer | Create a listing |
| GET | `/listings/{id}/` | — | Listing detail with writer info |
| PATCH / PUT | `/listings/{id}/` | Owner | Edit listing |
| DELETE | `/listings/{id}/` | Owner | Delete listing |

#### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/orders/` | JWT | My orders (doctor or writer view) |
| POST | `/orders/` | JWT | Place an order |
| GET | `/orders/{id}/` | Participant | Order detail |
| PATCH | `/orders/{id}/` | Writer | Update status (accept / decline / deliver) |

#### Requests & Proposals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/requests/` | — | Public board (filter, search, paginate) |
| POST | `/requests/` | JWT | Post a writing request |
| GET / PATCH / DELETE | `/requests/{id}/` | Owner | Manage a request |
| GET | `/requests/{id}/proposals/` | JWT | List proposals |
| POST | `/requests/{id}/proposals/` | Writer | Submit a proposal |
| PATCH | `/proposals/{id}/` | Request owner | Accept or reject a proposal |
| DELETE | `/proposals/{id}/` | Proposal writer | Withdraw a proposal |

---

## 6. SCM & QA Strategy

### 6.1 Source Control

Repository on GitHub. Branching model:

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code, merged by PR only |
| `dev` | Integration branch for reviewed features |
| `feature/*` | One branch per feature, merged into `dev` |
| `fix/*` | Bug fixes, same lifecycle as feature branches |

Commits follow the Conventional Commits convention (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

### 6.2 Testing

| Layer | Tool | What is covered |
|-------|------|-----------------|
| Backend unit & integration | pytest + DRF APIClient | All endpoints, permissions, status transitions |
| Backend fixtures | factory_boy | Deterministic model creation |
| Frontend components | Vitest + Testing Library | UI components, hooks, user interactions |
| Manual API testing | Postman | Auth flows, edge cases |
| Code quality | ESLint + Prettier (frontend) | Linting and formatting |

### 6.3 Deployment

Three environments: **local** (Docker Compose), **staging** (Railway/Render), **production** (Railway/Render). A GitHub Actions CI pipeline runs tests on every push to `dev` and blocks merges on failure. Deployment to staging is automatic on merge to `main`; promotion to production is manual after a smoke test.

---

## 7. Technical Justifications

| Technology | Why we chose it |
|------------|-----------------|
| **Django + DRF** | Built-in admin panel, mature ORM, and DRF covers auth, serializers, permissions, filtering, and pagination out of the box. The team has prior Django experience from Holberton (HBNB project). |
| **SimpleJWT** | Short-lived access tokens (15 min) with rotating refresh tokens minimise the risk of token theft. The blacklist module handles secure logout. |
| **React + Vite** | Component model fits a role-conditional UI (doctor vs. writer views). Vite is significantly faster than CRA and has built-in Vitest support. |
| **Tailwind CSS** | Utility-first styling allows fast iteration directly in JSX without managing separate stylesheets. |
| **TanStack React Query** | Handles server state (caching, background refetch) declaratively, keeping dashboards in sync without manual polling. |
| **Zustand** | Minimal auth state store. Simpler than Redux, with built-in localStorage persistence for the refresh token. |
| **PostgreSQL** | Relational integrity fits the marketplace data model. FK constraints and `on_delete=PROTECT` on orders prevent data loss at the DB level. |
| **Docker Compose** | Any team member can run the full stack in one command, eliminating environment setup issues. |

**Ethics note:** Kessia is a *declared* medical writing platform. In line with ICMJE and COPE guidelines, all writing contributions must be acknowledged in publications. No patient data (PHI) transits through the platform in v1.
