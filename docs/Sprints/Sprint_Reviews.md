# Kessia — Sprint Reviews

> What was demoed to the Product Owner (Soumia Taoui) at the end of each sprint,
> and the outcome. Each review coincided with a PO meeting — raw notes in
> [`../Meetings/`](../Meetings).

---

## Sprint 0 Review — Inception & Technical Documentation
**Meetings:** [05 May](../Meetings/260505_1st_Meeting.md) · [19 May](../Meetings/260519_2nd_Meeting.md)

**Presented**
- Problem statement, MVP scope, and the user-story backlog (MoSCoW).
- The colour pattern and an **early clickable MVP** (Meeting 2).
- The dual-publishing model: *annonces* (writer listings) **and** *demandes*
  (doctor requests) — confirmed by the PO.
- The register/role model: users are buyers by default, must activate writer mode.
- Profile fields (SIREN, portfolio, photo, professional title, badge, ratings).
- Candidate paper types (Protocole de recherche, Divulgation scientifique,
  Synopsis de recherche, Résumé de recherche).

**PO feedback / decisions**
- Colour pattern **validated**.
- Dual-publishing structure **confirmed**.
- Verified-badge committee approach agreed (admin-gated for v1).
- French-only for v1; more languages later.

**Outcome:** scope and specification **accepted** → green light for the MVP build.

---

## Sprint 1 Review — Core MVP (V1)
**Meeting:** [02 June](../Meetings/260602_3rd_Meeting.md)

**Demoed (end-to-end)**
- Sign-up / login (httpOnly-cookie JWT), writer activation.
- Listings catalogue with filters; listing detail; create/edit listing.
- Place an order; the full order status machine; deliverable upload/download.
- Requests board; submit a proposal; **accept a proposal → order created atomically**.
- Doctor & writer dashboards; public writer profiles.
- **Stripe Connect** pay-after-accept with escrow; release on completion; auto-refund.
- **Real-time messaging** between users.
- Reviews gated to completed orders; the verified-writer badge flow.
- Event emails across the order lifecycle.
- One-command Docker stack + a rich idempotent demo dataset.

**PO feedback / decisions**
- UI feels **"too monotone and soulless"** → plan a colour/identity revision.
- Add the **writer's profile photo** to offer cards to make the catalogue personal.
- Rework the **landing copy** around "a team of experts at your disposal".
- Commission fixed at **15%**; Stripe wiring to be finalised.
- PO to research the definitive **badge requirements**.
- Local-AI assistant noted as a **post-MVP** idea.

**Outcome:** V1 **accepted**; feedback fed into the Sprint 2 backlog.

---

## Sprint 2 Review — Hardening, Trust & Safety, Delivery
**Meeting:** 16 June (planned, with two field experts for domain feedback)

**To be demoed**
- Full **account lifecycle**: password reset, email verification (with banner +
  resend cooldown), change email/password, delete account, and **"Sign in with Google"**.
- **Trust & safety**: CGU/consent at signup + cookie banner (RGPD), **unverified
  read-only mode** (unverified users can browse/read but not publish, order or
  message), per-endpoint **rate-limiting**, and upload size/type limits.
- **Chat file attachments** with inline image and PDF preview.
- The **restyled UI** ("La Revue" identity) addressing the Meeting 3 feedback.
- The application running in **production** on Render with transactional email
  delivered through Brevo and the data on a managed Neon PostgreSQL database.
- Updated **specialty** and **paper-type** taxonomies from the PO's domain lists.

**Expected discussion points:** field-expert feedback on the writer verification
criteria and the realism of the paper-type taxonomy.
