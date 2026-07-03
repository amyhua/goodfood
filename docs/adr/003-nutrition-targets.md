# ADR-003 — Nutrition targets & the nutrient mode model

- **Status:** Accepted (Prompt 0, 2026-07-03)
- **Linear:** GOO-15 · Project: Nutrition Meal Planner
- **Invariants:** phase-brief rules 4, 6, 8, 9

## Context

Users need default daily nutrient targets and the ability to tune each nutrient. Targets are a
**different kind of data** from food facts and must come from a different authoritative source. We must
also model the honest "not exact" claim and the disabled-vs-zero distinction precisely.

## Decision

- **Target source:** default targets come from an **authoritative reference — FDA Daily Values / NIH
  ODS Dietary Reference Intakes (DRIs)** — keyed by a user **RecommendationProfile** (demographics).
  This is **separate** from USDA FDC food facts (rule 1 is about *facts*; targets are their own
  source). The reference infographic's numbers are illustrative and are **not** hardcoded as universal
  (rule 2 — never fabricate).
- **Per-nutrient mode** (see [product-spec §2.2](../product-spec.md#22-nutrient-modes-per-nutrient-per-profileplan)):
  `disabled` / `minimum` / `target` / `maximum`. **`disabled` removes the nutrient from optimization**;
  it is **not** `maximum = 0` (rule 8). These are distinct stored states and distinct solver models.
- **Tolerances:** per-nutrient `[low, high]` bands (default ±10% micros, ±5% cal/macros; ±2% slack on
  hard bounds). Range DRIs (e.g. EPA+DHA 250–500 mg) are `target` with both `min` and `max`.
- **Upper Limits (UL):** where a DRI UL exists it is a passive ceiling that raises an `over-ul` warning
  regardless of the user's chosen mode.
- **Honesty (rule 6):** the app claims *"meets all enabled hard constraints and lands within your
  chosen target ranges"* — never "exact". Status is `met`/`under`/`over`/`unknown`; **`unknown` when
  essential contributing data is missing** (rule 4) — a target is never "met" on missing data.
- **Storage:** `NutrientDefinition` holds canonical key/unit/category/conversion/source refs;
  `RecommendationProfile` + `RecommendationGoal` hold per-nutrient mode/min/target/max/tolerance/UL.
  Validation enforces `min ≤ target ≤ max` when all present, and valid units per nutrient.

## Consequences

- Defaults are profile-derived and swappable as DRI references update; no magic universal numbers.
- The disabled/zero distinction is representable end-to-end (DB → solver → proof → UI) and testable.
- "unknown" is a first-class status, so data gaps degrade honesty rather than correctness.

## Alternatives considered

- **Single "target %" per nutrient** — too weak to express floors, ceilings, ranges, and disabled.
  Rejected in favor of the four-mode model.
- **Hardcoding the reference infographic values** — fast but fabricated/universal; violates rules 2/4.
  Rejected; derive from DV/DRI keyed by profile.
