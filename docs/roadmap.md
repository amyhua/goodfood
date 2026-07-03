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
| 6 — Plan API & persistence | [GOO-22](https://linear.app/goodfoodapp/issue/GOO-22) | Done | /api/plans/* generate/get/save/duplicate/proof, candidate selection, independent proof verify, immutable revisions |
| 5 — Solver service | [GOO-21](https://linear.app/goodfoodapp/issue/GOO-21) | Done | FastAPI + OR-Tools CP-SAT /solve, strict+diagnostic, locks/bans/seed, OpenAPI->TS client |
| 4 — Proof engine | [GOO-20](https://linear.app/goodfoodapp/issue/GOO-20) | Done | Pure-TS nutrient calc, meal/day/week aggregation, honest status vs modes/tolerance, contributors, proof shape |
| 3 — USDA ingestion | [GOO-18](https://linear.app/goodfoodapp/issue/GOO-18) | Done | Typed FDC client (retry/cache/timeout), normalizer, idempotent import, /api/foods/*, 100-food live catalog |
| 2 — Nutrition & plan schema | [GOO-17](https://linear.app/goodfoodapp/issue/GOO-17) | Done | 21-model Prisma schema + CHECK invariants, seed, domain catalog/validation, DB integration tests |
| 1 — Monorepo & gates | [GOO-16](https://linear.app/goodfoodapp/issue/GOO-16) | Done | pnpm/Turbo monorepo, CI, health endpoints, Tailwind shell, all gates green |
| 0 — Product contract | [GOO-15](https://linear.app/goodfoodapp/issue/GOO-15) | Done | product-spec, architecture, roadmap, ADRs 001–003, req→test matrix |

## Phase log

<!-- Prepend each completed phase using the template below. -->

### Prompt F1 — Mobile-friendly design and usage — GOO-24 — 2026-07-03
**Queue:** goodfood-followups ([GOO-23](https://linear.app/goodfoodapp/issue/GOO-23)). First UI phase:
the base build reached only Prompt 6 (APIs, no UI), so F1 builds the core surfaces mobile-first
rather than retrofitting.
**Changed:** apps/web — responsive `AppShell` (mobile bottom tab bar + desktop sidebar, ≥44px targets),
`/planner` (collapsible `NutrientRail` + `MealList` `<details>` + responsive `ProofTable` table→cards),
`/foods` (`FoodSearch` client), `/pantry` (`Pantry`, localStorage), `/shopping` (`ShoppingList`,
pantry subtraction + print), new home page, print + no-overflow CSS in globals.css, `viewport` export.
`lib/plan-view.ts` = shared view model: `buildSamplePlan` runs the domain's clearly-labeled
SYNTHETIC_FOODS through the real `buildDayProof` engine (honest proof, missing≠0, no live solver/DB),
plus `serializedToPlanView` for real persisted plans and `aggregateShopping`. Playwright: added
iPhone-12 + Pixel-5 projects and `e2e/mobile.spec.ts`.
**Migrations:** none.
**Tests run:** lint OK; typecheck 9/9; pnpm test OK (web 21 passed incl. 6 new plan-view unit tests);
build OK (5 UI routes); Playwright 30 passed across chromium + iPhone-12 + Pixel-5 (no horizontal
overflow on /,/planner,/foods,/pantry,/shopping; bottom-nav ≥44px on mobile; sample proof renders;
meals collapse; rail collapses).
**Remaining gaps:** pantry is device-local (DB-backed per-user pantry comes with F2 auth); planner
Generate needs a live SOLVER_URL — offline it falls back to the honest sample; shopping uses the
sample plan until per-user saved plans (F2) wire in.
**Migration notes:** run `pnpm exec playwright install chromium webkit` before E2E. No schema/env change.
**Manual QA:** open /planner (sample), collapse a meal, resize to 375px — no overflow; add a pantry
item then open /shopping and toggle "Subtract pantry"; Print.

### Prompt 6 — Plan-generation API & persistence — GOO-22 — 2026-07-03
**Changed:** apps/web/src/server/plans (settings.ts Zod, candidates.ts selection+bans+diet+ranking,
generate.ts orchestrator+persistence+proof verify, read.ts serializer), src/lib/solver.ts,
5 routes under /api/plans, candidate/settings/generate tests. Solver: TARGET made soft (objective),
only MINIMUM/MAXIMUM hard (ADR-002) so real profiles stay feasible.
**Migrations:** none.
**Tests run:** lint OK; typecheck 9/9; pnpm test OK (5 pkgs, web 15 CI-safe); build OK (5 routes);
solver pytest 10. RUN_DB_INTEGRATION=1 (+solver): generate e2e 3 passed (verified/persisted/reloadable
plan, duplicate, snapshot stability). Live HTTP flow: generate=>feasible 3 meals/21-nutrient proof
(protein MET), get/save/duplicate/proof all 2xx.
**Remaining gaps:** meal-role assignment is uniform (all candidates all meals) until Prompt 8/10;
diet filtering acts on tags which USDA foods gain in Prompt 8; single-day only (weekly in Prompt 10).
**Migration notes:** generate needs SOLVER_URL reachable; integration tests gated behind
RUN_DB_INTEGRATION=1 + a running solver. Energy showing UNKNOWN/PARTIAL when a contributor lacks
energy data is correct honesty (invariant 4).
**Manual QA:** POST /api/plans/generate {seed} then GET/save/duplicate/proof.

### Prompt 5 — Optimization solver service — GOO-21 — 2026-07-03
**Changed:** services/solver (app/models.py Pydantic contract, app/solver.py CP-SAT strict+diagnostic,
app/main.py /solve, requirements +ortools==9.15.6755, tests/test_solve.py, README); packages/api-client
(openapi.json, generated src/solver-schema.ts, typed solve() + contract types, solve test, gen:solver
script); packages/config eslint ignore for generated schema.
**Migrations:** none.
**Tests run:** lint OK; typecheck 9/9; pnpm test OK (5 pkgs, +api-client solve); pnpm build OK; solver
pytest 10 passed (valid one-day plan w/ 3 meal groups + increment-aligned portions; impossible
vegan+no-B12 => diagnostics identifying vitamin_b12; banned never selected; same seed deterministic;
locked food remains; timeout != infeasible; diagnostic mode). Live HTTP /solve => OPTIMAL, energy hit
target 600, protein 50.5 >= 50.
**Remaining gaps:** solver treats MISSING as 0 for its own feasibility math (TS remains canonical
honest proof); candidate selection + web wiring land in Prompt 6.
**Migration notes:** none. Regenerate the TS client after any contract change (see solver README).
Solver holds no DB/secrets. Local venv on python3.9 (brew 3.12 pip broken); Docker/CI use 3.12.
**Manual QA:** `pnpm solver:dev` then POST /solve (see README).

### Prompt 4 — Nutrient calculation & proof engine — GOO-20 — 2026-07-03
**Changed:** packages/domain: proof.ts (aggregate/status/contributors/proof shape), portion.ts
(grams<->household), format.ts (display rounding), index.ts exports; proof/portion/format tests (+snapshot).
**Migrations:** none.
**Tests run:** lint OK; typecheck 9/9; pnpm test OK (5 pkgs); domain 30 tests — golden day reconciles
exactly with raw calc, property (2x grams => 2x known nutrient), missing=>UNKNOWN (target/max never MET
on missing; minimum MET when KNOWN>=min), proof-table snapshot.
**Remaining gaps:** engine consumes DB-shaped inputs; the plan API (Prompt 6) wires DB foods -> engine
and verifies solver output against it.
**Migration notes:** none. Pure functions; no rounding before calculation (display-only formatting).
**Manual QA:** buildDayProof(goals, meals) returns an explainable proof map per nutrient.

### Prompt 3 — USDA FoodData Central ingestion — GOO-18 — 2026-07-03
**Changed:** new packages/usda (client.ts retry/backoff/timeout/cache, normalize.ts per-100g +
alias/unit conversion, import.ts idempotent upsert, curated.ts ~100 staples, scripts/import-curated.ts,
types/units, fixture + normalize/client/import tests); apps/web (/api/foods/search, /api/foods/import,
/api/foods/[id], lib/usda.ts, next.config transpilePackages, vitest @ alias, search route test).
**Migrations:** none (uses Prompt 2 schema).
**Tests run:** `pnpm lint` ✓ · `typecheck` 9/9 ✓ · `pnpm test` ✓ (5 pkgs; USDA/DB integration
auto-skipped, zero live calls) · `RUN_DB_INTEGRATION=1` usda import idempotency ✓ · normalize (7) +
client mocked (5) ✓. Live: curated import populated **100 USDA-backed foods**; verified salmon
(protein 11.97 g, EPA+DHA 463 mg summed 1278+1272, iodine/choline MISSING≠0), kale (vit C 93.4 mg),
wheat germ oil (vit E 149.4 mg) — all source-backed.
**Remaining gaps:** search-term→FDC resolution picks the top match (a few imperfect, e.g. olive oil);
diet tags on USDA foods derived in Prompt 8; proof engine consumes this data in Prompt 4. 5 curated
terms 404'd on FDC detail (stale ids) and were skipped (logged).
**Migration notes:** none. Populate catalog with `USDA_FDC_API_KEY=... pnpm --filter @goodfood/usda
import:curated` (LOCAL/DEV only — never in CI). USDA client `fetch` is injectable so tests never hit
the network.
**Manual QA:** `GET /api/foods/search?q=salmon`, `POST /api/foods/import {fdcId}`, `GET /api/foods/:id`.

### Prompt 2 — Canonical nutrition & plan schema — GOO-17 — 2026-07-03
**Changed:** packages/db/prisma/schema.prisma (21 models + 12 enums), migration
`20260703195921_init_nutrition_plan_schema` (+ hand-added CHECK constraints), prisma/seed.ts,
packages/db package.json/tsconfig (+@goodfood/domain, prisma.seed), packages/db integration tests
(schema + snapshot immutability); packages/domain src/catalog.ts (nutrient catalog + default adult
goals + synthetic foods), src/validation.ts (goal/unit/grams/pantry validators), index.ts (enum
casing → Prisma), validation.test.ts.
**Migrations:** `20260703195921_init_nutrition_plan_schema` — applied cleanly to Neon (empty DB).
Includes CHECK constraints: grams>0, gramWeight>0, ediblePortionFactor>0, pantry qty>=0,
foodNutrient amount>=0, and min≤target≤max on goals.
**Tests run:** `pnpm lint` ✓ · `pnpm typecheck` 7/7 ✓ · `pnpm test` (offline; integration auto-skipped)
✓ · `RUN_DB_INTEGRATION=1` db suite ✓ (8 passed: 6 schema/CHECK/missing-not-zero, 1 snapshot
immutability, 1 factory) · domain validation ✓ (catalog + goal modes incl. DISABLED≠MAX-0). Seed ✓
(21 nutrients, 21 goals, 1 demo user, 4 synthetic foods; idempotent).
**Remaining gaps:** foods are SYNTHETIC placeholders until USDA ingestion (Prompt 3); no auth yet
(tenant ownership fields present, demo user only); proof engine computes from this schema in Prompt 4.
**Migration notes:** run `pnpm --filter @goodfood/db exec prisma migrate deploy` then
`prisma db seed`. Integration tests are gated behind `RUN_DB_INTEGRATION=1` (CI has no DB and skips
them); they require a seeded database.
**Manual QA:** `psql $DIRECT_URL -c "\dt"` shows 21 tables; seed populates the demo account +
default nutrient profile.

### Prompt 1 — Monorepo & quality gates — GOO-16 — 2026-07-03
**Changed:** root (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, eslint.config.mjs,
.prettierrc, .npmrc, .env.example, docker-compose.yml, .github/workflows/ci.yml); apps/web (Next 15
App Router, Tailwind v4, /health route, env validation, dashboard, Playwright, Dockerfile);
services/solver (FastAPI /health+/ready, pytest, requirements, Dockerfile, dev/test scripts);
packages/config, packages/domain, packages/db (Prisma datasource/generator), packages/api-client.
**Migrations:** none (Prisma datasource + generator only; models land in Prompt 2).
**Tests run:** `pnpm lint` ✓ · `pnpm typecheck` ✓ (7/7) · `pnpm test` ✓ (web 4, domain 4, api-client 2,
db 1) · `pnpm build` ✓ · solver `pytest` ✓ (3 passed). Manual: web dev + solver uvicorn both serve
`/health` 200.
**Remaining gaps:** Playwright specs authored but not run locally (browsers not installed; CI covers);
Prisma schema is datasource-only until Prompt 2; api-client is a hand-written shell until Prompt 5
generates from OpenAPI; docker images not built locally (docker absent) — Dockerfiles shipped.
**Migration notes:** run `pnpm install`, then `pnpm --filter @goodfood/db db:generate` before typecheck
(CI does this). Native build scripts allowlisted via `onlyBuiltDependencies` in pnpm-workspace.yaml.
**Manual QA:** `pnpm dev` → http://localhost:3000 (dashboard) + /health; `pnpm solver:dev` → :8000/health.
**Assumptions:** solver venv default `python3.12` (local Homebrew 3.12 has a broken libexpat/pip, so
proofs were run with system `python3` 3.9 — Docker/CI use 3.12); USDA key env renamed to
`USDA_FDC_API_KEY` per Prompt 1 (repo `.env` still carries the legacy `FDC_API_KEY`).

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
