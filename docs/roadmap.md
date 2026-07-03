# Roadmap — goodfood

> Running log of what shipped per phase, remaining gaps, and migration notes, plus the forward plan of
> independently shippable phases. **Every phase updates this file** (see
> [phase-brief.md](phase-brief.md#engineering-rules-per-phase-contract)). Each entry links its Linear
> issue (`GOO-N`). Product definitions live in [product-spec.md](product-spec.md); design in
> [architecture.md](architecture.md).

## Delivery plan — independently shippable phases

Queue **goodfood-build** ([GOO-14](https://linear.app/goodfoodapp/issue/GOO-14/queue-goodfood-build)).
**MVP cutline = Prompts 0–7.** Each phase is shippable on its own (docs, a package, a service, an API,
or a UI slice) and leaves the tree green.

| Phase | Linear | Ships | Key user features covered |
|-------|--------|-------|---------------------------|
| **0 — Product contract** | GOO-15 | docs + ADRs | (contract for everything below) |
| **1 — Monorepo & gates** | GOO-N | pnpm/Turbo monorepo, CI, health endpoints, Tailwind shell | dev can build/run/test; polished placeholder dashboard |
| **2 — Nutrition & plan schema** | GOO-N | Prisma schema + seed | nutrient catalog, profiles/goals, foods, pantry, bans, diets, plans/days/meals, snapshots, revisions |
| **3 — USDA ingestion** | GOO-N | FDC adapter, search/import/detail APIs, ~100-food catalog | search "salmon/kale/Greek yogurt/wheat germ oil"; source-backed per-100g data; missing≠zero |
| **4 — Proof engine** | GOO-N | `packages/nutrition` pure TS | portion conversion, meal/day/week aggregation, status vs modes, contributors, provenance, proof shape |
| **5 — Solver service** | GOO-N | FastAPI + OR-Tools `/solve`, OpenAPI→TS client | selected foods/portions, strict + diagnostic solve, locks, bans, seed, infeasibility diagnostics |
| **6 — Plan API & persistence** | GOO-N | `/api/plans/*` generate/get/save/duplicate/proof | generate→inspect→save→duplicate→reload a day; independent proof verify; candidate selection |
| **7 — Planner UI (MVP)** | GOO-N | `/planner/*`, `/foods`, `/settings/nutrition` | nutrient rail, meal sections, ingredient cards, proof table, per-nutrient mode toggle, missing-data warnings, a11y |
| **8 — Pantry & rules engine** | GOO-N | `/pantry`, `/settings/food-rules` | pantry qty/modes, custom bans, dietary presets, exclusion explanations, composable restriction engine |
| **9 — Shuffle/swap/locks** | GOO-N | interactive re-solve | lock ingredient/meal, shuffle, replace, re-solve, before/after diff, seeded reproducibility, revisions |
| **10 — Weekly & variety** | GOO-N | 1–4 week horizon | weekly/daily budgets, varying daily targets, variety rules, pantry depletion, weekly rollups |
| **11 — Shopping & print** | GOO-N | `/plans`, shopping lists, print views | saved-plan library + revisions, grouped/aggregated shopping list, pantry subtraction, Letter/Legal print |
| **12 — Nutrient education & images** | GOO-N | `/nutrients/*`, image system | nutrient detail pages (sourced), top foods, plan contribution, licensed images + SVG placeholders |
| **13 — Auth, deploy, hardening** | GOO-N | auth, deploy, observability | sign-up, per-user ownership + row-level authz, rate limits, logging, health/readiness, backups, CI/CD |

Every requested user-facing feature from the phase queue appears above and is traced to tests in
[requirement-test-matrix.md](requirement-test-matrix.md).

## Status board

| Phase | Linear | State | Summary |
|-------|--------|-------|---------|
| 0 — Product contract | [GOO-15](https://linear.app/goodfoodapp/issue/GOO-15) | In Progress | product-spec, architecture, roadmap, ADRs 001–003, req→test matrix |

## Phase log

<!-- Prepend each completed phase using the template below. -->

### Template (copy for each phase)

```markdown
### <Phase name> — GOO-N — YYYY-MM-DD
**Changed:** <files / packages touched>
**Migrations:** <prisma migration names, or "none">
**Tests run:** <lint / typecheck / vitest / pytest / playwright> → <results>
**Remaining gaps:** <what this phase deliberately left for later>
**Migration notes:** <anything needed to apply/roll forward safely>
**Manual QA:** <steps to verify by hand>
```

## Known gaps / backlog

- Monorepo scaffolding (apps/web, services/solver, packages/db|nutrition|contracts|api-client|config)
  not yet created (Prompt 1).
- Prisma schema + seed not yet created (Prompt 2).
- USDA FoodData Central ingestion not yet implemented (Prompt 3).
- Nutrition proof engine not yet implemented (Prompt 4).
- Solver service (FastAPI + OR-Tools) not yet implemented (Prompt 5).
- Plan API, UI, pantry, shuffle, weekly, shopping, education, auth/deploy: Prompts 6–13.
