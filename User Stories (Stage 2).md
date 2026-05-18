# Kessia – User Stories (Stage 2)

## 0.1 User Stories

Kessia has three actor types:
- **User** — any registered account (default state after sign-up)
- **Writer** — a user who has activated writer mode on their account
- **Doctor / Institution** — a user browsing and ordering services
- **Admin** — platform operator

Stories are prioritized with **MoSCoW** against the MVP defined in Stage 1.

---

### Must Have

**Authentication & Registration**

- As a visitor, I want to sign up with email and password.
- As a registered user, I want to log in and out.
- As a user, I want to activate writer mode on my account to unlock listing creation.

**Service Listings (Writer)**

- As a writer, I want to create a listing with title, description, specialty, deliverable type, price, and turnaround.
- As a writer, I want to edit or delete my listings.

**Browsing & Discovery (Doctor)**

- As a doctor, I want to browse all published listings.
- As a doctor, I want to filter listings by specialty and deliverable type.
- As a doctor, I want to view a full service detail page including writer info.

**Order Placement (Doctor)**

- As a doctor, I want to place an order from a service page.
- As a doctor, I want to see my order ID and status after placing an order.

**Order Management (Writer)**

- As a writer, I want to be notified when a new order comes in.
- As a writer, I want to accept, decline, or mark an order as delivered.

**Order Visibility (Both Roles)**

- As a doctor, I want to see the status of my orders (pending / accepted / declined / delivered).
- As a writer, I want to see all orders linked to my listings with their statuses.

**Reverse Listings**

- As a doctor, I want to post a writing request with topic, specialty, deadline, and budget.
- As a writer, I want to browse open requests and submit a proposal.

**Responsive UI**

- As any user, I want the platform to work on mobile.

---

### Should Have

**User Dashboards**

- As a doctor, I want a dashboard showing all my orders and their statuses.
- As a writer, I want a dashboard showing my listings and incoming orders.

**Public Writer Profile**

- As a doctor, I want to view a writer's public profile (bio, specialties, active listings).
- As a writer, I want a public profile page to present my background and services.

**Admin — Content & User Management**

- As an admin, I want to view all registered users and their roles.
- As an admin, I want to deactivate or remove a listing that violates platform terms.

**Payments (Stripe)**

- As a doctor, I want to pay securely through the platform via Stripe.
- As a writer, I want payments held in escrow and released upon delivery confirmation.

**Integrated Messaging**

- As a doctor, I want to message a writer after placing an order.
- As a writer, I want to reply to client messages within the platform.

**Verified Specialty Badges**

- As a writer, I want to request a verified badge by submitting my credentials.
- As a doctor, I want to see verified badges on writer profiles and listings.
- As an admin, I want to review badge requests and approve or reject them.

---

### Could Have

**Notifications**

- As any user, I want email notifications for key events (order placed, accepted, delivered).

---

### Won't Have

- **International scaling** (i18n, multi-currency, tax compliance) — deferred until the model is validated in the initial market.

---

## 0.2 Mockups

Kessia has a React + Tailwind CSS frontend, so wireframes apply.

| Screen | Key Elements |
|---|---|
| Landing / Home | Value proposition, sign-up CTA |
| Registration Page | Email, password, profile fields |
| Login Page | Email + password |
| Public Listings Catalog | Listing cards (specialty, price, turnaround), filter sidebar |
| Service Detail Page | Full listing, writer info panel, "Place Order" CTA |
| Order Page | Order summary, status badge, back-to-catalog link |
| Writer Dashboard | Listings table, incoming orders with status + actions |
| Doctor Dashboard | Placed orders table with status tracking |
| Create / Edit Listing Form | Title, description, specialty, deliverable type, price, turnaround |

Wireframes will be produced in Figma as a separate deliverable.
