# 🩺 Kessia – Team Formation, Brainstorming and MVP (Stage 1)

## 0. Team Formation

- **Team Members**:
  - Soumia Taoui — Product Owner & Project Sponsor
  - Yasi Philippe Hübner — Backend Lead / co-developer
  - Victor Monnot — Frontend Lead / co-developer
- **Initial Meeting**: Team members introduced themselves, shared backgrounds, technical strengths, and interests in healthcare and product design. Soumia Taoui presented the project brief and confirmed the scope and constraints.
- **Roles Assigned**: Victor Monnot has been nominated as temporary Project Manager to coordinate the first stage. Soumia Taoui holds the Product Owner role for the duration of the project — she owns the product vision, validates deliverables at each milestone, and provides domain and coordination input throughout.
- **Team Norms**:
  - Communication via Discord.
  - Task management with GitHub Projects.
  - Weekly sync meeting every Monday (Victor, Yasi & Soumia).

## Tech Stack

- **Backend**: Django (Python). Chosen for its built-in multi-role authentication, robust ORM, and admin panel — the latter will be especially useful when the badge validation workflow is added later.
- **Frontend**: React with Tailwind CSS for styling.
- **Database**: PostgreSQL.
- **Hosting**: Railway or Render (to be confirmed at deployment stage).

## 1. Research and Brainstorming

- **Individual Research**: Each member explored existing freelance marketplaces (Malt, Fiverr, Upwork), the medical writing industry (EMWA, AMWA), and academic publishing requirements (ICMJE authorship guidelines, COPE).
- **Group Brainstorming**:
  - **Mind Mapping**: Explored ideas around two-sided marketplaces, trust and verification systems, healthcare-specific workflows, and ethical considerations of medical writing.
  - **SCAMPER Framework**: Applied to the freelance marketplace model (e.g., Substitute generic profiles with specialty-verified ones, Adapt escrow patterns for academic deliverables).
  - **"How Might We" Questions**:
    - How might we connect time-poor doctors with qualified scientific writers in a few clicks?
    - How might we guarantee writer credibility in highly specialized medical fields?
    - How might we keep the platform compliant with academic ethics (declared contributorship, no ghostwriting)?
    - How might we make the experience trustworthy for both sides on day one?

## 2. Idea Evaluation

### Criteria Defined
- Potential impact for end users (time saved for clinicians, opportunity created for writers).
- Technical alignment with the chosen stack (Django, React Tailwind CSS, PostgreSQL).
- Achievability for a 2-person student team within the project timeframe.
- Scalability toward a real SaaS model after the project.

### Scope Definition

The features below are split into two scopes: what is mandatory to deliver a working platform (the MVP), and what is planned afterwards on the roadmap. Each post-MVP item is tagged by stage:
- **Important** → For a better experience for both sides of the marketplace.
- **Optional** → Add-ons and extras.
- **Future** → Roadmap items for scaling the platform.

### MVP Features

| Feature | Notes | Risks |
|---|---|---|
| Dual-role sign-up & authentication | Two account types: medical professionals/institutions (clients) and scientific writers (freelancers). Account type chosen at registration, drives the rest of the UX. | Need clean role-based access control from day one — refactoring later is painful. |
| Writer service listings (create / edit / delete) | A writer can publish a service offer (title, description, scope, deliverable type, indicative price, turnaround). | None major. |
| Public listings page (browse services) | Doctors can browse all available services, with basic filtering (specialty, deliverable type). | None. |
| Service detail page | Full description of the offer, writer info, and a clear "Order" call-to-action. | None. |
| Order placement (no payment yet) | A doctor can place an order from a service page. The writer is notified, and both parties arrange the actual delivery off-platform in v1. Order is recorded with status (pending / accepted / declined / delivered). | Need to define the order state machine carefully even without payment. |
| Database recording users, services, orders | Persistent storage for accounts, listings, and orders, with timestamps and status tracking. | Schema design must anticipate later additions (chat, payments, badges). |
| Responsive / mobile-friendly UI | The site must work cleanly on phones — clinicians and writers will both use it on mobile. | Standard requirement in 2026, no excuse to skip. |

### Post-MVP Roadmap

| Feature | Notes | Risks | Stage |
|---|---|---|---|
| User dashboard (per role) | Each user sees their own data: writers see their listings and incoming orders; doctors see their orders. | None. | Important |
| Public profile pages | Each writer has a public profile showing their listings, bio, specialties. | None. | Important |
| Reverse listings — doctors post a request | A doctor can post a specific need; writers can respond with a tailored proposal. Turns the platform into a true two-sided marketplace. | Adds significant UX complexity (proposals, negotiation). High product value. | Important |
| Stripe integration (payments + escrow logic) | Secure payment with funds held until delivery validation. | First-time integration; Stripe Connect for marketplace flows is more complex than standard Checkout. | Important |
| Integrated chat (client ↔ writer) | In-platform messaging once an order is placed or a proposal sent. | Real-time stack adds infrastructure complexity (WebSockets, presence). | Optional |
| Verified specialty badges | Writers can request a badge for a given medical specialty. An admin / panel of experts reviews credentials and validates. Badge appears on profile + listings. | Requires an admin workflow and a recruited expert panel — non-trivial to bootstrap. | Future |
| International scaling (i18n, multi-currency) | Multi-language UI and currency support to open the platform beyond a single country. | i18n is doable; multi-currency + tax compliance is a much bigger project. | Future |

### Risks Identified
- **Ethical and regulatory risk (highest priority)**: Major medical journals (ICMJE, BMJ, COPE) require any substantive writing contribution to be declared in the authorship or acknowledgments. The platform must explicitly position itself as a *declared medical writing* service, not a ghostwriting one. This shapes the product copy, the terms of service, and the deliverables themselves (e.g., a default template acknowledgment block).
- **Trust and verification**: Both sides need to be credible. Doctors expect competent writers; writers expect serious clients. Without verification, the platform risks fraud and low-quality matches.
- **Sensitive data**: If clinical material (patient cases, datasets) transits through the platform, GDPR / HIPAA-equivalent considerations apply. The MVP should explicitly *not* host PHI in v1.
- **Two-sided market cold start**: Classic chicken-and-egg problem. Need a launch strategy that seeds one side first (likely writers).
- **Liability on published content**: Who is responsible if a published paper has errors? Terms of service must clarify that the platform is an intermediary, not a publisher.
- **Time management**: Scope discipline is critical for a 2-person team — the post-MVP list is tempting but must wait.

## 3. Decision and Refinement

- **Final MVP Selected**: A two-sided marketplace connecting medical professionals and scientific writers, with role-based accounts, public service listings, and an order flow (no payment in v1).
- **Problem Solved**: Clinicians and researchers often have valuable case material or research ideas but lack the time to write them up. Specialized scientific writers exist but are hard to find and vet through general freelance platforms.
- **Target Audience**:
  - **Demand side**: Hospital practitioners, private clinicians, and small research teams without dedicated medical writing staff.
  - **Supply side**: Freelance scientific and medical writers, often with a science/medical background.
  - **Geographic rollout**: Launch focused on Toulouse, France, then expansion to the rest of France, then international scaling once the model is validated.
- **Key Features (MVP)**:
  - Dual-role sign-up (client / writer).
  - Writers can publish service listings.
  - Doctors can browse listings and place an order.
  - Persistent storage of users, listings, and orders.
  - Responsive UI.
- **Expected Outcome**: A functional MVP demonstrating the full flow from registration → listing publication → order placement, with a clean foundation to plug payments, chat, and verification on top.

## 4. Idea Development Documentation

### Ideas Considered
- **Generic medical freelance platform (any medical service)**: Rejected — too broad, no clear differentiator vs existing platforms.
- **Patient-facing telemedicine marketplace**: Rejected — heavy regulatory burden (medical practice licensing, prescription rules).
- **Pure CV / portfolio site for medical writers**: Rejected — no transactional value, low product depth.
- **Two-sided marketplace, doctors ↔ scientific writers (selected)**: Balanced scope, clear unmet need, defensible niche.

### Selected MVP Summary
- **Rationale**: The scope is achievable for a 2-person team in the project timeframe, the niche is real and underserved, and the foundation supports meaningful post-MVP features (payments, chat, verification, reverse listings).
- **Potential Impact**: Saves hours of writing time for clinicians while creating a structured income channel for qualified scientific writers — both sides benefit, and academic publishing potentially gets more case studies and reviews that would otherwise never be written.

### Team Overview
- Formed a 3-person team: Product Owner (Soumia Taoui) and two co-developers (Victor & Yasi), with clear communication norms and role boundaries.
- Followed a structured brainstorming and evaluation process before committing to scope.
- Defined a clear MVP and a prioritized post-MVP roadmap to avoid scope creep.

## 📊 User Journey MVP

### Writer (supply side)
1. **Sign up** → choose "Writer" account type, fill profile (name, specialties, bio).
2. **Create a listing** → publish a service offer (title, description, scope, price, turnaround).
3. **Manage listings** → edit or remove offers from a personal dashboard view.
4. **Receive orders** → see incoming orders and update their status (accept / decline / mark as delivered).

### Doctor / Institution (demand side)
1. **Sign up** → choose "Medical professional" account type, fill institutional info.
2. **Browse listings** → explore the public catalog, filter by specialty or deliverable type.
3. **View a service** → open a listing to read the full offer and the writer's profile.
4. **Place an order** → confirm the order from the service page (no payment in v1). The writer is notified.
5. **Off-platform handoff** → both parties arrange the actual delivery (file exchange, briefing) outside Kessia in v1.
6. **Order confirmation** → see order details and follow status updates from a personal dashboard view.
