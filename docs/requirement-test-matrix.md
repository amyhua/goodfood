# Requirement → Test matrix — goodfood

> Maps every user-facing requirement to its intended coverage: **U**nit (Vitest/pytest), **I**ntegration
> (API/DB/contract), **E**2E (Playwright), **A**ccessibility. Built in Prompt 0; each later phase fills
> in the concrete test names as it lands. Product definitions: [product-spec.md](product-spec.md).

Legend: ✅ = covered by that layer · — = n/a. "Phase" = the Prompt that implements + tests it.

| # | Requirement | U | I | E2E | A | Phase |
|---|-------------|---|---|-----|---|-------|
| R1 | Nutrient stored per 100 g with source id/dataset/unit/quality/importedAt | ✅ | ✅ | — | — | 2,3 |
| R2 | Missing nutrient data stays `missing`, never coerced to 0 | ✅ | ✅ | — | — | 3,4 |
| R3 | A target is never "met" when essential contributing data is missing | ✅ | ✅ | — | — | 4,6 |
| R4 | Per-nutrient mode: disabled / minimum / target / maximum | ✅ | — | ✅ | — | 4,7 |
| R5 | `disabled` ≠ `maximum of 0` (distinct data, model, and UI) | ✅ | ✅ | ✅ | ✅ | 4,5,7 |
| R6 | Target tolerances + display rounding (no round before calc) | ✅ | — | — | — | 4 |
| R7 | Portion conversion grams ↔ household measures | ✅ | — | — | — | 4 |
| R8 | Nutrient calc per-100g × grams / 100; meal/day/week aggregation | ✅ | — | — | — | 4 |
| R9 | Linear scaling: doubling grams doubles known nutrients (property) | ✅ | — | — | — | 4 |
| R10 | Proof table: target, actual, %, status, contributors, sources | ✅ | ✅ | ✅ | ✅ | 4,6,7 |
| R11 | Provenance: every number traces to FDC id/dataset/import time | ✅ | ✅ | ✅ | — | 3,4,7 |
| R12 | USDA search returns salmon/kale/Greek yogurt/wheat germ oil | — | ✅ | — | — | 3 |
| R13 | Protein/vitamin E/choline present for fixture foods | ✅ | ✅ | — | — | 3 |
| R14 | Absent iodine/choline stays missing, not zero | ✅ | ✅ | — | — | 3 |
| R15 | Import idempotency (same FDC id → no dup) | — | ✅ | — | — | 3 |
| R16 | No live external API calls in CI | — | ✅ | — | — | 3 |
| R17 | Solver returns 3 meal groups + valid portions | — | ✅ | — | — | 5 |
| R18 | Banned foods never selected (solver + shuffle + substitution) | ✅ | ✅ | ✅ | — | 5,8,9 |
| R19 | Same seed → equivalent/deterministic solver output | — | ✅ | — | — | 5,9,10 |
| R20 | Locked foods remain present after solving | — | ✅ | ✅ | — | 5,9 |
| R21 | Infeasibility diagnostics; timeout ≠ infeasible | ✅ | ✅ | — | — | 5,6 |
| R22 | Impossible vegan+no-legume+no-fortified → useful diagnostics | — | ✅ | — | — | 5 |
| R23 | Solver contract documented via OpenAPI → generated TS client | — | ✅ | — | — | 5 |
| R24 | Generate → inspect → save → duplicate → reload a day plan | — | ✅ | ✅ | — | 6,7 |
| R25 | Solver output inconsistent with TS proof is rejected | ✅ | ✅ | — | — | 6 |
| R26 | Saved snapshots stable after later catalog edits (immutability) | ✅ | ✅ | — | — | 2,6 |
| R27 | Invalid settings → structured Zod validation errors | ✅ | ✅ | — | — | 6 |
| R28 | Candidate selection: solver never gets whole DB | ✅ | ✅ | — | — | 6 |
| R29 | Planner UI: rail, meals, ingredient cards, generate action | — | — | ✅ | ✅ | 7 |
| R30 | Status never conveyed by color alone; visible focus; keyboard nav | — | — | ✅ | ✅ | 7 |
| R31 | Show grams + friendlier serving language; pantry vs shopping | ✅ | — | ✅ | — | 7,8 |
| R32 | Pantry modes: pantry-only / prefer-pantry / pantry-plus-shopping | ✅ | ✅ | ✅ | — | 8 |
| R33 | Pantry-only never recommends a missing ingredient | ✅ | ✅ | — | — | 8 |
| R34 | Dietary presets: vegan/vegetarian/pescatarian/nondairy/paleo/keto/whole-foods | ✅ | ✅ | ✅ | — | 8 |
| R35 | Vegan→no animal; nondairy→no dairy; pescatarian→fish not poultry/red meat | ✅ | ✅ | — | — | 8 |
| R36 | Explain why a food was excluded | ✅ | ✅ | ✅ | — | 8 |
| R37 | Uncertain classification surfaced, not silently assumed safe | ✅ | — | — | — | 8 |
| R38 | Lock/unlock ingredient & meal; never silently alter a lock | ✅ | ✅ | ✅ | — | 9 |
| R39 | Shuffle meal/ingredient by role; replacement honors all rules+locks | ✅ | ✅ | ✅ | — | 9 |
| R40 | Before/after nutrient diff before committing a change | — | — | ✅ | — | 9 |
| R41 | Infeasible replacement → exact affected constraints + adjustments | ✅ | ✅ | — | — | 9 |
| R42 | Every material change writes an immutable PlanRevision | ✅ | ✅ | — | — | 9 |
| R43 | 1–4 week horizon; daily or aggregate weekly cal/macro budgets | ✅ | ✅ | — | — | 10 |
| R44 | Varying daily targets (training vs rest days) | ✅ | ✅ | — | — | 10 |
| R45 | Variety: max repeats/week, no same dinner adjacent days, min unique | ✅ | ✅ | ✅ | — | 10 |
| R46 | Pantry depletion across days not exceeded | ✅ | ✅ | — | — | 10 |
| R47 | Weekly rollups reconcile with day totals | ✅ | — | — | — | 10 |
| R48 | Impossible daily but feasible weekly → warning | ✅ | ✅ | — | — | 10 |
| R49 | Saved-plan library: search, duplicate, archive, revision history | — | ✅ | ✅ | — | 11 |
| R50 | Shopping list: grouped, aggregated grams, pantry subtraction | ✅ | ✅ | — | — | 11 |
| R51 | Unknown-qty pantry items → "check pantry", not subtracted | ✅ | ✅ | — | — | 11 |
| R52 | Print view (Letter/Legal), no editing controls | — | — | ✅ | ✅ | 11 |
| R53 | Nutrient detail pages: sourced info, unit, UL, completeness caveats | — | ✅ | ✅ | ✅ | 12 |
| R54 | Food ranking uses actual per-100g values | ✅ | ✅ | — | — | 12 |
| R55 | Images without license metadata fall back to placeholders | ✅ | ✅ | — | ✅ | 12 |
| R56 | Auth; migrate demo→authenticated ownership | — | ✅ | ✅ | — | 13 |
| R57 | Row-level authz: no cross-user access to plans/pantry/rules/shopping | — | ✅ | ✅ | — | 13 |
| R58 | Rate limiting on food search / plan generation / solver | — | ✅ | — | — | 13 |
| R59 | Health + readiness checks; structured logs w/ request ids | ✅ | ✅ | — | — | 1,13 |
| R60 | Env validation; never expose USDA key / DB creds to browser | ✅ | ✅ | — | — | 1,13 |
| R61 | Solver outage & USDA timeout handled gracefully | — | ✅ | — | — | 13 |
| R62 | Full happy path: signup→pantry→plan→shuffle→save week→print→shopping list | — | — | ✅ | ✅ | 13 |
