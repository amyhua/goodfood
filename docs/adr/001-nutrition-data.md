# ADR-001 — Nutrition data source & normalization

- **Status:** Accepted (Prompt 0, 2026-07-03)
- **Linear:** GOO-15 · Project: Nutrition Meal Planner
- **Invariants:** phase-brief rules 1–5

## Context

Food nutrient facts must be authoritative, source-traceable, and legally reusable. We must never
fabricate numbers, and missing data must not be silently treated as zero.

## Decision

- **USDA FoodData Central (FDC) is the canonical source** of food nutrient facts. FDC is public-domain
  (CC0) and API-accessible.
- **Prioritize Foundation Foods and SR Legacy** datasets for generic ingredients. Branded entries are
  only trusted for a nutrient when that nutrient is actually present in source data — never used as
  proof of micronutrients they don't report.
- **Store per 100 g** with `sourceFoodId` (FDC id), `dataset`, `nutrientSourceId`, `unit`, a
  **data-quality state** (`known` / `partial` / `missing` / `estimated` / `user_entered`), and
  `importedAt`. Retain **raw source payloads** sufficient to trace every displayed number.
- **Missing ≠ zero (rule 4).** A missing nutrient is `amount = NULL, state = 'missing'`, propagates as
  `unknown`, and can never prove a requirement met.
- **Aliases** for tricky nutrients are ingested from the already-converted FDC fields: folate **DFE**
  (1190), vitamin A **RAE** (1106), vitamin E **α-tocopherol** (1109), vitamin D µg (1114), choline
  (1180), ALA (1404), EPA (1278), DHA (1272). We never derive DFE/RAE ourselves or substitute raw
  folate/IU fields.
- **Synthetic fixtures are labeled synthetic (rule 2)** and kept separate from FDC-backed foods; **no
  live FDC calls in CI**.
- **Idempotent imports** keyed by FDC id + dataset; caching + retry/backoff + bounded timeouts on the
  server-only client.

## Consequences

- Every number is auditable back to an FDC id and import timestamp.
- Sparse nutrients (iodine, choline) will legitimately be `missing` for many foods — surfaced as
  data-completeness caveats rather than hidden.
- We carry raw payloads (storage cost) to preserve provenance.

## Alternatives considered

- **Nutritionix / Edamam / branded DBs** — richer branded coverage but licensing constraints and
  weaker micronutrient provenance. Rejected as canonical; may supplement images/branded lookups later.
- **Coercing missing → 0** — simpler math, but violates rule 4 and would let plans falsely claim
  targets met. Rejected outright.
