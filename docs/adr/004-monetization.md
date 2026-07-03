# ADR-004 — Monetization (inactive by default)

**Status:** Accepted · 2026-07-03 · GOO-33 (Prompt F10)

## Context

goodfood is a free tool. Cloud costs (Neon, solver, hosting, USDA calls) still exist, so we want the
*option* to monetize without changing the product's character. The hard requirement: shipping this
must not make the app cost anything or restrict anyone. It must be **off by default** and fully
configurable.

## Decision

Ship a **freemium scaffold that is inactive by default**:

- A single master switch `enabled` (default **false**). When false, there is **no metering, no
  paywall, no ads** — the app is 100% free and unrestricted. This is enforced at one choke point:
  `evaluateGate()` returns `allowed` immediately when `enabled` is false.
- When an operator turns it on: the **free tier** gets a monthly cap on plan (and, later, list)
  creation; **premium** (~$5/month, `premiumUntil` on the user) lifts the cap. Price, limits, and
  which features are premium are all configurable.
- **Ads** are a separate switch (`adsEnabled`, default false) rendering a labeled placeholder slot,
  not a live ad network.
- **Billing** is Stripe-ready but inert: `/api/billing/checkout` returns `configured:false` unless
  `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID` are set (test mode). No live charging is wired.

### Configuration (all optional; absent ⇒ default/off)

Environment: `MONETIZATION_ENABLED`, `FREE_MONTHLY_PLAN_LIMIT`, `FREE_MONTHLY_LIST_LIMIT`,
`PREMIUM_PRICE_USD`, `ADS_ENABLED` (server) · `NEXT_PUBLIC_ADS_ENABLED` (client) ·
`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` · `ADMIN_EMAILS`.

Runtime: an admin (email in `ADMIN_EMAILS`) can flip settings at **/admin/settings**, stored in the
`AppSetting` singleton and layered over env. Resolution order: `DEFAULT_CONFIG` (off) ← env ← DB
override.

## Consequences

- The default deploy is unchanged for users: free, no limits, no ads.
- Turning monetization on is a deliberate operator action (env or admin toggle), reversible instantly.
- The gate is a pure function (`evaluateGate`) with an exhaustive unit test matrix, so "disabled ⇒
  always allowed" and "premium ⇒ always allowed" are guaranteed, not incidental.
- Product invariants are untouched: gating limits *quantity*, never the honesty of a plan's proof.

## Alternatives considered

- **Ads-only** — rejected as the default character; kept as an optional, off slot.
- **Hard-coded limits** — rejected; everything is configurable so operators tune to real costs.
- **Third-party paywall SDK** — rejected for a thin, self-hosted gate we fully control and can keep
  provably inert.
