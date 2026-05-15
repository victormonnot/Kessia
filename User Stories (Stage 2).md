# Kessia – User Stories (Stage 2)

## 0.1 User Stories

Kessia has three actor types:
- **Doctor / Institution** — the demand side (client placing orders)
- **Writer** — the supply side (freelancer publishing services)
- **Admin** — platform operator managing the site

Stories are prioritized with **MoSCoW** in relation to the MVP defined in Stage 1.

---

### Must Have — essential for MVP

**Authentication & Registration**

- As a visitor, I want to choose my account type (Doctor or Writer) when signing up, so that the platform can show me a role-appropriate experience from the start.
- As a visitor, I want to register with my email and a password, so that I can create an account on the platform.
- As a registered user, I want to log in with my email and password, so that I can access my personal workspace securely.
- As a logged-in user, I want to log out, so that I can protect my account on shared devices.

**Service Listings (Writer)**

- As a writer, I want to create a service listing (title, description, specialty, deliverable type, indicative price, turnaround), so that medical professionals can discover and understand what I offer.
- As a writer, I want to edit an existing listing, so that I can keep my offer accurate and up to date.
- As a writer, I want to delete a listing, so that I can remove services I no longer provide.

**Browsing & Discovery (Doctor)**

- As a doctor, I want to browse all published service listings on a public catalog page, so that I can explore what writers are offering.
- As a doctor, I want to filter listings by medical specialty and deliverable type, so that I can quickly narrow down relevant offers.
- As a doctor, I want to view a full service detail page (complete description, scope, price, turnaround, writer info), so that I can make an informed decision before placing an order.

**Order Placement (Doctor)**

- As a doctor, I want to place an order directly from a service detail page, so that I can engage a writer without leaving the platform.
- As a doctor, I want to see a confirmation after placing an order (order ID, service name, status), so that I know my request has been recorded.

**Order Management (Writer)**

- As a writer, I want to receive a notification when a new order is placed on one of my listings, so that I can respond promptly.
- As a writer, I want to accept or decline an incoming order, so that I can manage my workload.
- As a writer, I want to mark an order as delivered, so that the doctor knows the work is ready.

**Order Visibility (Both Roles)**

- As a doctor, I want to see the current status of my orders (pending / accepted / declined / delivered), so that I can track progress.
- As a writer, I want to see a list of all orders linked to my listings, with their statuses, so that I can manage my pipeline.

**Responsive UI**

- As any user, I want the platform to be fully usable on a mobile phone, so that I can access Kessia from any device.

---

### Should Have — important, but not critical for MVP

**User Dashboards**

- As a doctor, I want a personal dashboard showing all my placed orders and their statuses, so that I have a central view of my activity.
- As a writer, I want a personal dashboard showing my published listings and all incoming orders, so that I can manage my freelance activity in one place.

**Public Writer Profile**

- As a doctor, I want to view a writer's public profile (bio, listed specialties, published listings), so that I can assess their credibility before ordering.
- As a writer, I want a public profile page that presents my background and active listings, so that I build trust with potential clients.

**Admin — Content & User Management**

- As an admin, I want to view all registered users (with their roles), so that I can monitor platform activity.
- As an admin, I want to deactivate or remove a listing that violates the platform's terms, so that content quality and ethical standards are maintained.

---

### Could Have — nice to have, post-MVP roadmap

**Reverse Listings (Doctor posts a request)**

- As a doctor, I want to post a specific writing request (topic, specialty, deadline, budget), so that writers can find and respond to my exact need.
- As a writer, I want to browse open doctor requests and submit a proposal, so that I can proactively pitch for relevant work.

**Payments (Stripe)**

- As a doctor, I want to pay for a service securely through the platform using Stripe, so that I can handle billing without leaving Kessia.
- As a writer, I want the platform to hold payment in escrow and release it on delivery confirmation, so that I am protected from non-payment.

**Integrated Messaging**

- As a doctor, I want to send a message to a writer once an order is placed, so that I can share a brief or clarify requirements without using external tools.
- As a writer, I want to reply to a client's message within the platform, so that all project communication stays in one place.

**Verified Specialty Badges**

- As a writer, I want to request a verified badge for a medical specialty by submitting my credentials, so that clients can trust my claimed expertise.
- As a doctor, I want to see a verified badge on a writer's profile and listings, so that I can identify writers whose specialties have been validated by the platform.
- As an admin, I want to review badge requests and approve or reject them, so that only credible writers receive the verification mark.

**Notifications**

- As any user, I want to receive an email confirmation when a significant event occurs (order placed, accepted, delivered), so that I stay informed even when I am not logged in.

---

### Won't Have — explicitly out of scope for this project

- **International scaling (i18n, multi-currency, tax compliance)** — deferred until the model is validated in the initial market.
- **Hosting of patient health data (PHI)** — explicitly excluded for GDPR / HIPAA reasons; the platform is an intermediary, not a clinical data store.

---

## 0.2 Mockups

Kessia has a user interface (React + Tailwind CSS frontend), so wireframes apply.

The following screens have been identified as the main flows to wireframe:

| Screen | Key Elements |
|---|---|
| Landing / Home | Value proposition, CTA to sign up as Doctor or Writer |
| Registration Page | Role selector (Doctor / Writer), email, password, profile fields |
| Login Page | Email + password, link to register |
| Public Listings Catalog | Listing cards (title, specialty, price, turnaround), filter sidebar |
| Service Detail Page | Full listing description, writer info panel, "Place Order" CTA |
| Order Confirmation | Order summary, status badge, back-to-catalog link |
| Writer Dashboard | Active listings table, incoming orders table with status + actions |
| Doctor Dashboard | Placed orders table with status tracking |
| Create / Edit Listing Form | Title, description, specialty, deliverable type, price, turnaround fields |

Wireframes will be produced in Figma as a separate deliverable.
