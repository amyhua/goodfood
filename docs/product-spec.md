# Product Spec — goodfood

> The product contract for the goodfood nutrition meal planner. Governed by the invariants in
> [phase-brief.md](phase-brief.md#core-product-rules-invariants--never-trade-away) and the autonomy
> rules in [../CLAUDE.md](../CLAUDE.md). This spec defines **what** the product does and **what the
> data means**; [architecture.md](architecture.md) defines **how** it is built; [roadmap.md](roadmap.md)
> sequences delivery. Companion decisions: [adr/001-nutrition-data.md](adr/001-nutrition-data.md),
> [adr/002-optimization.md](adr/002-optimization.md), [adr/003-nutrition-targets.md](adr/003-nutrition-targets.md).

## 1. Product summary

goodfood generates meal plans (breakfast / lunch / dinner, optional snack) that satisfy a user's
per-nutrient goals, calorie/macro budget, dietary restrictions, and pantry, and proves it with a
**source-linked nutrient proof table**. The truthful claim is always *"this plan meets all enabled
hard constraints and lands within your chosen target ranges"* — never *"hits your targets exactly"*
(invariant 6).

## 2. Nutrient model

### 2.1 Initial nutrient set

21 nutrients ship initially. Each has a canonical key, a display name, a **canonical storage unit**,
and one or more USDA FDC source nutrient numbers used to ingest it. Values are stored **per 100 g**
(invariant 3).

| # | Canonical key | Display name | Unit | Category | Notes / FDC source |
|---|---------------|--------------|------|----------|--------------------|
| 1 | `energy` | Calories | kcal | energy | Atwater / FDC energy (kcal) |
| 2 | `protein` | Protein | g | macro | FDC 1003 |
| 3 | `carbohydrate` | Carbohydrate | g | macro | FDC 1005 (by difference) |
| 4 | `fat` | Total fat | g | macro | FDC 1004 |
| 5 | `fiber` | Fiber | g | macro | FDC 1079 |
| 6 | `calcium` | Calcium | mg | mineral | FDC 1087 |
| 7 | `vitamin_d` | Vitamin D | mcg | vitamin | FDC 1114 (D2+D3), µg |
| 8 | `iron` | Iron | mg | mineral | FDC 1089 |
| 9 | `folate_dfe` | Folate | mcg DFE | vitamin | FDC 1190 (DFE), not 1177 folate total |
| 10 | `choline` | Choline | mg | vitamin-like | FDC 1180 |
| 11 | `iodine` | Iodine | mcg | mineral | FDC 1100 (sparse in FDC) |
| 12 | `potassium` | Potassium | mg | mineral | FDC 1092 |
| 13 | `magnesium` | Magnesium | mg | mineral | FDC 1090 |
| 14 | `vitamin_c` | Vitamin C | mg | vitamin | FDC 1162 |
| 15 | `vitamin_e` | Vitamin E | mg | vitamin | FDC 1109 (α-tocopherol) |
| 16 | `vitamin_k` | Vitamin K | mcg | vitamin | FDC 1185 (phylloquinone) |
| 17 | `vitamin_a_rae` | Vitamin A | mcg RAE | vitamin | FDC 1106 (RAE), not 1104 IU |
| 18 | `vitamin_b12` | Vitamin B12 | mcg | vitamin | FDC 1178 |
| 19 | `selenium` | Selenium | mcg | mineral | FDC 1103 |
| 20 | `omega3_ala` | Omega-3 ALA | g | fatty acid | FDC 1404 (18:3 n-3) |
| 21 | `omega3_epa_dha` | Omega-3 EPA+DHA | mg | fatty acid | FDC 1278 (EPA, 20:5) + 1272 (DHA, 22:6), summed |

**Unit discipline.** Units are heterogeneous (g / mg / mcg / mcg DFE / mcg RAE / kcal). The canonical
storage unit is fixed per nutrient; conversions (e.g. IU→mcg, mg→g) happen only at ingestion, with the
conversion rule recorded on the `NutrientDefinition`. `folate_dfe`, `vitamin_a_rae`, and
`vitamin_e` (α-tocopherol) are ingested from the **already-converted** FDC fields — we never derive DFE
or RAE ourselves and never substitute the raw folate/IU fields for them.

### 2.2 Nutrient modes (per nutrient, per plan/profile)

Each nutrient is set to exactly one **mode**. Modes are the heart of invariant 6/8.

| Mode | Meaning | Solver effect | Proof effect |
|------|---------|---------------|--------------|
| `disabled` | The nutrient is **ignored**. | **Removed from the model entirely** — no term, no bound. | Shown as "not tracked" (grey), *not* as 0 and *not* as a max. |
| `minimum` | Floor: consumed ≥ `min`. | Hard lower-bound constraint. | `met` when `consumed ≥ min` (within tolerance); else `under`. |
| `target` | Aim for `target`, within tolerance band `[target−tol⁻, target+tol⁺]`. | Hard band constraint (or soft with penalty; see ADR-002). | `met` inside band; `under`/`over` outside. |
| `maximum` | Ceiling: consumed ≤ `max`. | Hard upper-bound constraint. | `met` when `consumed ≤ max`; else `over`. |

> **`disabled` ≠ `maximum` of 0 (invariant 8).** Disabling **removes** the nutrient from optimization
> so the solver neither seeks nor limits it. Setting `maximum = 0` is a *hard ceiling of zero* that
> forbids the nutrient. These are different data (`mode='disabled'` vs `mode='maximum', max=0`),
> produce different solver models, and render differently in the proof table. The UI must never
> collapse one into the other.

A nutrient may also carry an **upper limit (UL)** independent of the user's chosen mode — e.g. a
tolerable upper intake level from the DRIs. When a UL exists, it is a passive ceiling surfaced as an
`over-ul` warning even if the user's mode is `minimum`/`target`.

### 2.3 Target tolerances & display rounding

- **Tolerances** are per-nutrient and expressed as a percentage of target (default) or an absolute
  amount, stored as `tolLowPct`/`tolHighPct` (or absolute variants). Default target tolerance = **±10%**
  for micronutrients, **±5%** for calories/macros. `minimum`/`maximum` bounds use a **±2%** slack to
  absorb floating-point/rounding noise only.
- **Ranges as targets.** Some DRIs are ranges (e.g. EPA+DHA 250–500 mg). A range is modeled as
  `mode='target'` with `min` and `max` both set and no single point — "met" means inside `[min,max]`.
- **Rounding policy (invariant 4, "no round before calculating"):** all math runs on **raw Decimal**
  per-100 g values. Rounding happens **only at display time**. Display rules:
  - Calories → nearest 1 kcal. Macros (g) → nearest 0.1 g. mg → nearest 1 mg (or 0.1 mg below 10 mg).
    mcg → nearest 1 mcg. Percent-of-target → nearest 1%.
  - Never display a rounded value that contradicts its status: status is computed from raw values,
    so a value shown as "100%" that is raw-99.4% is labeled by its **raw** status, not the rounded one.

## 3. Proof & provenance

**"Proof"** = a per-nutrient, per-plan record that a reader can trace from a displayed number back to
source data. The stable proof shape (finalized in Prompt 4) is:

```
{
  nutrientKey, mode, target/min/max, tolerance,
  consumed (raw + display), percentOfTarget,
  status: met | under | over | unknown,
  confidence: complete | partial | missing,     // data completeness, not a guess of correctness
  contributors: [{ foodId, foodName, grams, amount, unit, pctOfTotal, dataQuality }],
  sources: [{ foodId, fdcId, dataset, nutrientSourceId, importedAt }]
}
```

- **Provenance display.** Every contributing food links to its FDC id, dataset (Foundation / SR Legacy
  / …), and import timestamp. The proof table renders these as "source" links so a user can audit
  every number (invariant 9).
- **`unknown` / missing.** If any food contributing meaningfully to a nutrient has **missing** data for
  it, the nutrient's status is at best `unknown` and can **never** be reported as `met` on the strength
  of missing data (invariant 4). Percent shows "—", never 0%.

## 4. Food data quality states

Every `FoodNutrient` carries a data-quality state; the food's per-nutrient completeness drives proof
`confidence`.

| State | Meaning |
|-------|---------|
| `known` | A measured value present in the source dataset. |
| `partial` | Present but flagged low-quality/low-sample in source, or derived from a related form. |
| `missing` | No value in source. **Treated as unknown, never 0** (invariant 4). |
| `estimated` | Imputed by us via an explicit, recorded rule (e.g. retention factor). Labeled as such. |
| `user_entered` | Supplied by the user for a custom food. Never presented as USDA-backed. |

Missing vs. zero is enforced at the type level: a `FoodNutrient` row either has a Decimal `amount`
with a non-`missing` state, or `amount = NULL` with state `missing`. Aggregation skips `missing` and
propagates `unknown` into the affected nutrient's proof.

## 5. Dietary restrictions

Two layers, composed by the restriction engine (Prompt 8). **Hard bans/allergies always win**
(invariant 7).

- **Absolute exclusions (hard):** user **banned foods** and **allergies**. These override everything,
  including presets, shuffle, and substitution. A banned food can never re-enter a plan.
- **Dietary presets (compile to food-tag rules):**
  - `vegan` — excludes all animal-derived foods.
  - `vegetarian` — excludes meat/poultry/fish/seafood; allows dairy/eggs.
  - `pescatarian` — allows fish/seafood; excludes poultry and red meat.
  - `nondairy` — excludes milk/yogurt/cheese/butter/dairy-tagged foods.
  - `paleo` — excludes grains, legumes, dairy, refined sugar.
  - `keto` — a **macro constraint** (very low carb) **plus** a food policy (exclude high-carb staples).
  - `whole-foods` — excludes foods tagged heavily processed.
- **Custom bans/allergies:** free-form user additions, treated as absolute exclusions.
- **Ambiguity is surfaced, never silently assumed safe.** When a food's classification for a rule is
  uncertain, it is flagged for the user rather than assumed compliant (invariant spirit + Prompt 8).

## 6. Pantry

Pantry items carry a food, an inventory quantity (grams or a supported household unit, **non-negative**),
and an availability flag (`unlimited` / `limited` / `unavailable`). Three **pantry modes**:

| Mode | Behavior |
|------|----------|
| `pantry-only` | Plan may use **only** pantry foods; never recommends anything to buy. |
| `prefer-pantry` | Solver **prefers** pantry foods (objective weight), may add shopping foods to feasibility. |
| `pantry-plus-shopping` | Pantry + the allowed shopping catalog are all candidates; plan marks each ingredient as pantry vs. shopping. |

Pantry quantity is respected as a hard cap in `pantry-only`; unknown-quantity items are marked
"check pantry" rather than assumed infinite (detailed in Prompt 11).

## 7. Plan structure & horizon

- **Horizon:** 1 day through **4 weeks** initially. A plan has `durationDays`; days roll up to weekly
  rollups (Prompt 10).
- **Meal structure:** each `PlanDay` has **breakfast, lunch, dinner**, and an **optional snack**. Meal
  roles carry templates (e.g. protein + produce + carbohydrate) enforced by the solver where sensible.
- **Targets by horizon:** calorie/macro/nutrient goals may be **per-day** or **aggregate weekly**;
  daily targets may vary (e.g. high-protein training days vs. lower-calorie rest days) — Prompt 10.

## 8. Interactivity: locks, shuffle, substitution

- **Locked ingredient:** pinned; re-solves never alter it (invariant respect: *never silently alter a
  locked ingredient*). The solver treats it as fixed input.
- **Locked meal:** the whole meal is fixed; only other meals re-solve.
- **Shuffle (meal or ingredient):** request an alternative. Ingredient shuffle first searches
  same-meal-role, comparable-purpose alternatives. Every shuffle result honors bans, diet, pantry
  mode, and all locks. A banned food can **never** re-enter via shuffle.
- **Substitution:** replace an ingredient via search; the remaining (unlocked) meals re-solve around
  the choice, minimizing changes to untouched meals. A before/after nutrient diff is shown before
  committing. Every material change writes an immutable `PlanRevision`.

## 9. Solver failure & infeasibility diagnostics

- **Never fail silently or fabricate.** When no valid plan exists, the app runs a **diagnostic relaxed
  solve** that minimizes violations and returns the **smallest set of changes** likely to make it
  feasible (loosen nutrient X, drop restriction Y, add a shopping food, raise the calorie ceiling).
- **Timeout ≠ infeasible (invariant, Prompt 5):** a solve that runs out of time budget reports
  `time_limit` status with the best feasible solution found so far — it is **never** reported as
  "infeasible". Infeasibility is only claimed when the relaxed model proves the constraint set has no
  solution.
- Diagnostics reference concrete constraints (which nutrient bound, which restriction, which pantry
  cap) so the message is actionable.

## 10. Data lineage (five distinct stages)

The architecture keeps these five representations **separate** (invariant 3/5, acceptance criterion):

1. **Raw source data** — verbatim USDA FDC payloads + metadata (traceable, never shown directly).
2. **Normalized data** — per-100 g `Food`/`FoodNutrient` with units, aliases, data-quality states.
3. **User preferences** — profiles, nutrient modes/targets, diets, bans, pantry, plan settings.
4. **Solver inputs / outputs** — candidate vectors + constraints sent to the solver; selected
   foods/grams + diagnostics returned. The solver returns **only selections**; TS is canonical proof.
5. **Immutable saved-plan snapshots** — the exact nutrient values used at generation time, frozen so
   later food-data edits never alter a saved plan (invariant 5). Each revision is immutable + auditable.

See [architecture.md](architecture.md) for the diagram and the request/response flow.
