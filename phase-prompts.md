You are implementing the goodfood app AUTONOMOUSLY in a persistent session (self-hosted via
scripts/run-queue.sh, or claude.ai/code). Work top to bottom, one phase at a time.

============================================================================================
GLOBAL RULES (apply to every phase)
============================================================================================
Operate strictly under this repo's CLAUDE.md and AGENTS.md. In particular:
- §0 Autonomy Contract — NO clarifications, NO validation/approval, END-TO-END, NO interference.
  Make best-effort standard-default guesses for any ambiguity, log them in the Linear issue, and
  keep going. Never stop to ask or wait. The only stop condition is queue completion or a genuinely
  unrecoverable external failure (report it in writing, never as a question).
- Sequential subagents — spawn subagents with the Task tool ONE AT A TIME; never start subagent N+1
  until N has returned. You (the top-level session) are the orchestrator and own ALL Linear writes
  (GraphQL against https://api.linear.app/graphql using LINEAR_API_KEY from .env / env).
- Every ask is TRACKED (Linear GOO-N) and COMMITTED (git, `Issue ID: GOO-N` trailer, pushed).
- Every issue is parented to a Linear Project that has a PRD; a PRD is written for every major stream.
- Respect the 10 product invariants in docs/phase-brief.md. Honest claims only: never "exact."

QUEUE REGISTRATION (do once, before Phase 1):
- Queue name: foundation-to-mvp   |   Date: 2026-07-03
- Create a PARENT Linear tracking issue in team GOO titled "Queue: foundation-to-mvp" whose
  description lists the phases below as a checklist. Each phase is a CHILD issue (GOO-N) of it.
- Add a row to docs/cloud-queues.md (name, date, Host, parent-issue URL, tmux/session, status=In
  Progress); commit + push.

PER-PHASE LOOP (repeat for each phase; never begin N+1 until N is fully Done):
1. Read AGENTS.md, docs/phase-brief.md, docs/architecture.md, and any relevant package READMEs.
2. Create/locate the phase's Linear issue GOO-N under the right Project (create the Project + PRD
   first if the phase opens a new stream); set the issue In Progress. Child of the queue parent.
3. Make the SMALLEST COHERENT change that satisfies the phase. Use Prisma migrations; NEVER reset or
   destroy the database. Gather code/context via sequential subagents.
4. TEST COVERAGE: add tests for all new domain logic + validation (Vitest for TS, pytest for Python,
   Playwright for E2E where a user flow exists). VALIDATION SCOPE: validate all external/user input
   with Zod (TS) and Pydantic (Python); missing nutrient data is never coerced to 0.
5. Run lint, typecheck, unit tests, and relevant E2E — paste real command output as proof.
6. Update docs/roadmap.md (what changed, remaining gaps, migration notes).
7. Commit (`Issue ID: GOO-N` trailer) and push. NEVER commit .env / secrets.
8. Set the issue Done with a completion comment; tick the queue parent checklist + registry row.
9. Report: changed files, migrations, tests run + results, manual QA steps. Then continue to N+1.

ON QUEUE COMPLETION: set the parent issue Done, mark docs/cloud-queues.md status = Complete, commit +
push, and post a final summary listing every GOO-N shipped.

============================================================================================
=== PHASE QUEUE (execute in order) — best-effort decomposition; edit freely before running ===
============================================================================================

Phase 1 — Monorepo scaffold & toolchain  [Project: Web App]
Scope: Stand up the pnpm + Turborepo monorepo per docs/architecture.md: apps/web (Next.js App
  Router, TypeScript strict, Tailwind), packages/db, packages/nutrition, packages/contracts. Root
  tooling: TS strict base config, ESLint + Prettier, Vitest, Playwright, turbo pipelines, and
  package.json scripts (lint, typecheck, test, e2e, build, dev). apps/web renders a placeholder home
  page. Add a README per package.
Acceptance: `pnpm install` clean; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass;
  `pnpm dev` serves the placeholder page; no loose root dirs; TS strict everywhere (no stray .js).
Test coverage: a trivial Vitest unit in packages/nutrition and one Playwright smoke test that loads
  the home page.
Validation scope: n/a (no external input yet) — but wire Zod into packages/contracts with one example
  schema + test.

Phase 2 — Database foundation (Prisma + Neon)  [Project: Platform & Infrastructure]
Scope: In packages/db, add Prisma with datasource url=env("DATABASE_URL"), directUrl=env("DIRECT_URL").
  Model the nutrition core per product rules 3–5: Food (sourceFoodId, sourceVersion/date), NutrientFact
  (per-100g value, unit, dataQuality enum: measured|imputed|missing), FoodImage (license fields),
  and the DataQuality state. Create the FIRST migration; generate the typed client; export it.
Acceptance: `prisma migrate dev` applies against the Neon test branch (verify connection); typed
  client builds; `pnpm typecheck` passes; a seed script inserts ONE clearly-labeled SYNTHETIC fixture
  (rule 2) and a smoke query reads it back. Never reset/destroy the DB.
Test coverage: Vitest integration test that migrates a scratch schema, inserts a synthetic Food +
  NutrientFacts, and asserts per-100g storage + that a missing nutrient is absent (NOT 0).
Validation scope: Zod schemas mirroring the Prisma models in packages/contracts, with tests.

Phase 3 — USDA FoodData Central ingestion  [Project: Nutrition Data]
Scope: Server-side FDC client (uses FDC_API_KEY) that fetches foods and NORMALIZES them into per-100g
  NutrientFact snapshots cached in Neon, tagging sourceFoodId + sourceVersion/date + unit + quality.
  Provide a CLI/script to ingest a small curated seed set (the ~20 foods in the reference image).
  Label any non-USDA values synthetic. Do NOT fabricate data; missing nutrients stay missing.
Acceptance: ingest script populates the seed foods with real USDA data; a report shows source ids +
  versions; re-running is idempotent (upsert by sourceFoodId+version). Rate-limit-safe.
Test coverage: unit tests for the normalizer (unit conversions, per-100g math, missing→absent) using
  RECORDED FDC fixtures labeled synthetic; a contract test for the FDC client with a mocked HTTP layer.
Validation scope: validate FDC responses with Zod before persisting; reject/flag malformed records.

Phase 4 — Nutrient targets & profiles  [Project: Nutrition Data]
Scope: Model daily nutrient targets as disabled | minimum | target | maximum + tolerance (rules 6/8).
  Seed authoritative DRI/FDA-DV defaults keyed to a user profile (age/sex), NOT the infographic's
  numbers. Provide the ~19 daily-recommended nutrients from the reference layout with correct units.
  API + Zod contracts to read/customize targets (raise protein, disable a nutrient, set a range).
Acceptance: default targets resolve per profile; disabling a nutrient REMOVES it (never max=0);
  customizations round-trip; units preserved (g/mg/mcg/mcg DFE/mcg RAE).
Test coverage: unit tests for target resolution + the disabled/min/target/max/tolerance semantics,
  incl. the "disable ≠ zero" rule and range handling.
Validation scope: Zod validation on all target edits; reject nonsensical ranges (min>max, etc.).

Phase 5 — Meal solver service (FastAPI + OR-Tools)  [Project: Meal Solver]
Scope: apps/solver — Python 3.12 FastAPI + OR-Tools. Input contract (shared via packages/contracts):
  available ingredients, per-nutrient constraints, banned/allergy exclusions (ABSOLUTE hard
  constraints, rule 7), dietary pattern, calorie/macro budgets. Output: breakfast/lunch/dinner with
  per-ingredient portions and per-nutrient contributions + the data to build the source-linked proof
  table (rule 9). Model "exact" as hard constraints within displayed tolerances (rule 6). When
  infeasible, return a structured explanation + suggested adjustments (never silently fail). Dockerize.
Acceptance: solver returns a feasible plan for the seed foods meeting hard constraints within
  tolerance; disabling a nutrient drops it from the model; an over-constrained request returns an
  infeasibility explanation; container builds and serves.
Test coverage: pytest for constraint satisfaction, absolute exclusions, disable-removes-nutrient,
  tolerance handling, and the infeasible→explanation path.
Validation scope: Pydantic validation on all solver inputs/outputs; contract parity with the Zod
  schemas in packages/contracts (a cross-check test).

Phase 6 — End-to-end plan generation & the plan view  [Project: Web App]
Scope: Wire apps/web → solver. Build the plan screen modeled on docs/assets/plan-view-reference.jpeg:
  left daily-nutrient rail, Breakfast/Lunch/Dinner sections, ingredient cards (thumbnail [licensed
  only, rule 10], name, portion, contribution list {nutrient, amount, unit, %DV}), and the
  SOURCE-LINKED nutrient proof table. Show "—" (never 0%) for undefined %DV (rule 4). Ship the honesty
  footnotes. Persist saved plans with an IMMUTABLE nutrition snapshot (rule 5).
Acceptance: a user sets targets + available ingredients and gets a rendered plan with a working proof
  table; saving a plan freezes its snapshot (later food-data changes don't alter it); undefined %DV
  renders as "—".
Test coverage: Vitest for the %DV / proof-table logic + snapshot immutability; Playwright E2E for the
  full generate→view→save flow.
Validation scope: Zod on the plan-request API; server-side re-validation before calling the solver.

Phase 7 — Interactivity: shuffle, pin-and-reshuffle, constraints  [Project: Web App]
Scope: Shuffle an ingredient/meal for an alternative; pin an ingredient and reshuffle the rest to
  still meet constraints; enable randomization; banned-foods management; dietary patterns (vegan,
  vegetarian, pescatarian, non-dairy, whole-foods, paleo, keto); calorie budget + macro targets per
  day / N days / week.
Acceptance: shuffle/pin produce constraint-valid alternatives or a clear "no alternative" message;
  banned/allergy foods are never recommended; each dietary pattern filters correctly.
Test coverage: unit tests for shuffle/pin re-solve invariants; E2E for shuffle + banned-food exclusion.
Validation scope: Zod on all new controls; reject conflicting settings with actionable messages.

Phase 8 — Multi-day plans, shopping list, print, nutrient reference  [Project: Web App]
Scope: Plans over a week / N weeks / month; save/load plans; generate a shopping list; printable plan
  pages (print CSS); a nutrient-reference browser (each daily-recommended nutrient + foods rich in it,
  source-linked); infeasibility guidance surfaced in the UI with recommended adjustments.
Acceptance: a month plan generates and saves; shopping list aggregates correctly; print view is clean;
  nutrient reference pages load with sourced data; infeasible settings show guidance.
Test coverage: unit tests for shopping-list aggregation + multi-day rollups; E2E for save/load/print/
  reference.
Validation scope: Zod on all new inputs; consistent handling of missing data (never 0) across views.
