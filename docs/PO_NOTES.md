# Product notes

Running notes from product-owner discussion — company/product context and open questions raised
along the way, not a spec. See [DEPLOYMENT.md](DEPLOYMENT.md) and [DATABASE.md](DATABASE.md) for
what's actually built.

## Company & product

- **TSE Pvt Ltd** is the company. **MediZen** is TSE's AI SaaS product — appointment booking and
  an AI doctor-assistant for hospitals, clinics, and individual doctors.
- [tse_ops](DEPLOYMENT.md) (`/tse_ops`) is TSE's internal tool for onboarding a new facility onto
  MediZen: a hospital, a clinic, or an individual doctor's practice, each with one admin login.
  Branded "MediZen Ops — Powered by TSE Pvt Ltd." to read as TSE's internal tool, distinct from
  the MediZen product the facility's own staff use day to day.

## Facility types

tse_ops onboards three kinds of customer, all through the same form today:

| Type | Example |
|---|---|
| Hospital | Patna General Hospital |
| Clinic | Sunrise Family Clinic |
| Individual Doctor | Dr. A. Sharma — General Physician |

An individual doctor is onboarded as a one-person facility (their own admin login), not as a
`doctors` row under someone else's hospital — the same onboarding flow covers all three.

## Open questions

Things raised but not decided:

- **Real onboarding data:** tse_ops currently writes to an in-memory list that resets on every
  backend restart (`backend/hospitals.py`), seeded with 9 sample facilities so the page isn't
  empty after a deploy. Moving to the schema in [DATABASE.md](DATABASE.md) is the next step before
  this is used for real customers.
- **tse_ops login:** currently the same demo credential as the rest of the app
  (`DEMO_USERNAME`/`DEMO_PASSWORD`). Worth a dedicated TSE staff login before this is
  internet-facing with real hospital data behind it.
- **Per-facility login:** an onboarded admin's username/password isn't wired into the main app's
  login yet — onboarding only records it. Connecting it is a deliberate next step, not an oversight.
