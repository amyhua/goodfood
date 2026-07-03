You are implementing the goodfood app AUTONOMOUSLY in a persistent session (self-hosted via
scripts/run-queue.sh on Elgin-1, or claude.ai/code). Each PROMPT below (0–13) is ONE phase. Work top
to bottom, one phase at a time.

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

EXISTING CONTEXT to read first: CLAUDE.md, AGENTS.md, docs/phase-brief.md, docs/architecture.md,
docs/infrastructure.md, and the reference plan layout image docs/assets/plan-view-reference.jpeg
(this is the "attached nutrient-map layout" referenced in Prompt 7). Note: docs/architecture.md and
docs/roadmap.md already exist and Prompt 0 will (re)write/extend them — audit before clobbering.

QUEUE REGISTRATION (do once, before Prompt 0):
- Queue name: goodfood-build   |   Date: 2026-07-03
- Create a PARENT Linear tracking issue in team GOO titled "Queue: goodfood-build" whose description
  lists Prompts 0–13 as a checklist, and notes the MVP cutline (Prompts 0–7 = shippable MVP; 8–13 =
  full product). Each Prompt is a CHILD issue (GOO-N) of it.
- Add a row to docs/cloud-queues.md (name, date, Host=Elgin-1, parent-issue URL, tmux session,
  status=In Progress); commit + push.

PER-PHASE LOOP (repeat for each Prompt; never begin Prompt N+1 until N is fully Done):
1. Read AGENTS.md, docs/phase-brief.md, docs/architecture.md, and any relevant package READMEs.
2. Create/locate the phase's Linear issue GOO-N under the right Project (create the Project + PRD
   first if the phase opens a new stream); title it like "Prompt N — <title>"; set it In Progress.
   Child of the "Queue: goodfood-build" parent.
3. Make the SMALLEST COHERENT change that satisfies the Prompt's Acceptance criteria. Use Prisma
   migrations; NEVER reset or destroy the database. Gather code/context via sequential subagents.
4. TEST COVERAGE: implement the Prompt's listed tests (Vitest for TS, pytest for Python, Playwright
   for E2E). VALIDATION SCOPE: validate all external/user input (Zod in TS, Pydantic in Python);
   missing nutrient data is never coerced to 0; a target is never "met" when essential data is missing.
5. Run lint, typecheck, unit tests, and relevant E2E — paste real command output as proof.
6. Update docs/roadmap.md (what changed, remaining gaps, migration notes).
7. Commit and push. COMMIT MESSAGE references the prompt, e.g. `Prompt 3: USDA FDC ingestion layer`,
   and ends with the `Issue ID: GOO-N` trailer. (Mentioning "Prompt #N" in commits is expected.)
   NEVER commit .env / secrets.
8. Set the issue Done with a completion comment; tick the parent checklist + registry row.
9. Report: changed files, migrations, tests run + results, manual QA steps. Then continue to N+1.

ON QUEUE COMPLETION: set the parent issue Done, mark docs/cloud-queues.md status = Complete, commit +
push, and post a final summary listing every GOO-N shipped. MVP is reached after Prompt 7.

============================================================================================
=== PHASE QUEUE — Prompts 0–13 (execute in order). MVP cutline = Prompts 0–7. ===
============================================================================================

Prompt 0 — Lock the product contract
Create the product and architecture contract for the meal-planning app before implementing feature code.

Write:
- docs/product-spec.md
- docs/architecture.md
- docs/roadmap.md
- docs/adr/001-nutrition-data.md
- docs/adr/002-optimization.md
- docs/adr/003-nutrition-targets.md

Define:
- The initial nutrient set:
  calories, protein, carbohydrate, total fat, fiber, calcium, vitamin D, iron,
  folate DFE, choline, iodine, potassium, magnesium, vitamin C, vitamin E,
  vitamin K, vitamin A RAE, vitamin B12, selenium, ALA omega-3, EPA+DHA.
- Nutrient modes: disabled, minimum, target, maximum.
- Target tolerances and display rounding policy.
- What “proof” means and how food-source provenance is displayed.
- Food data quality states: known, partial, missing, estimated, user-entered.
- Dietary restrictions: vegan, vegetarian, pescatarian, nondairy, paleo, keto,
  whole-foods, plus custom bans/allergies.
- Pantry modes: pantry-only, prefer-pantry, pantry-plus-shopping.
- Meal plan horizon: 1 day through 4 weeks initially.
- Meal structure: breakfast, lunch, dinner, optional snack.
- Locked ingredients, locked meals, shuffle behavior, and substitution behavior.
- Solver failure behavior and actionable infeasibility diagnostics.

Include a Mermaid architecture diagram showing:
Next.js web app -> Next route handlers -> Neon/Postgres
Next route handlers -> Python solver
Next route handlers -> USDA FoodData Central adapter/cache

Create a requirement-to-test matrix mapping every user-facing requirement to unit, integration, or E2E coverage.

Do not build production UI or solver code yet.

Acceptance criteria:
- Architecture clearly distinguishes raw source data, normalized data, user preferences,
  solver inputs, solver outputs, and immutable saved-plan snapshots.
- “Disable nutrient” and “limit nutrient to zero” are explicitly different concepts.
- Every requested user feature appears in the roadmap.
- The roadmap is divided into independently shippable phases.


Prompt 1 — Bootstrap the monorepo and quality gates
Bootstrap the repository as a pnpm/Turborepo monorepo.

Create:
- apps/web: Next.js App Router + TypeScript + Tailwind
- services/solver: Python FastAPI service
- packages/domain: shared pure TypeScript domain models and calculations
- packages/db: Prisma schema, client, migrations, seed utilities
- packages/api-client: typed client for the solver OpenAPI contract
- packages/config: shared TypeScript, ESLint, Tailwind, and test config

Set up:
- strict TypeScript
- ESLint and Prettier
- Vitest
- pytest
- Playwright
- GitHub Actions CI that runs lint, typecheck, unit tests, and build
- .env.example with DATABASE_URL, DIRECT_URL, USDA_FDC_API_KEY, SOLVER_URL,
  AUTH_SECRET, and optional BLOB_STORAGE credentials
- Dockerfiles for web and solver
- docker-compose.yml for local Postgres and local solver development
- /health endpoint in Next.js and FastAPI

Use a minimal, polished Tailwind shell with a placeholder dashboard page.

Validation:
- Validate environment variables at startup.
- Never expose USDA keys or database credentials to the browser.

Tests:
- Web health endpoint test.
- Solver health endpoint pytest.
- CI verifies TypeScript package boundaries and Python importability.

Acceptance criteria:
- pnpm install, pnpm dev, pnpm lint, pnpm typecheck, pnpm test, and pnpm build work.
- Solver starts locally and returns a health response.
- CI passes from a clean checkout.


Prompt 2 — Build the canonical nutrition and plan schema
Implement the Neon/Postgres Prisma schema and seed data for the nutrition planner.

Create models for:
- User and Profile
- NutrientDefinition
- RecommendationProfile
- RecommendationGoal
- Food
- FoodAlias
- FoodNutrient
- FoodPortion
- FoodTag
- FoodImage
- PantryItem
- FoodBan
- DietaryPreference
- MealPlan
- PlanDay
- Meal
- MealIngredient
- PlanNutrientSnapshot
- SolverRun
- PlanRevision

Requirements:
- Use Decimal/numeric storage for nutrient values and gram quantities.
- Food nutrients are stored per 100 g with source food ID, source dataset,
  nutrient source ID, unit, data-quality state, and imported-at timestamp.
- Nutrient definitions include canonical key, display name, unit, conversion rules,
  nutrient category, and source references.
- Recommendation profiles support demographic defaults and custom goals.
- Saved plan snapshots include the exact food nutrient values used at generation time.
- Every plan revision is immutable and auditable.
- Implement tenant ownership fields now, even if full authentication ships later.

Seed:
- The defined nutrient catalog.
- A default “adult general nutrition” profile.
- A demo user for local development only.
- A small synthetic test catalog, clearly separate from USDA-backed foods.

Validation:
- Enforce no duplicate nutrient keys.
- Enforce min <= target <= max when all are configured.
- Enforce valid units for each nutrient.
- Enforce positive gram amounts and nonnegative pantry inventory.

Tests:
- Prisma schema integration tests against local Postgres.
- Unit tests for target-profile validation.
- Tests proving saved plan snapshots are not affected by later food edits.

Acceptance criteria:
- Prisma migration applies cleanly.
- Seed command creates a usable local demo account and nutrient profile.
- The database can represent every major feature without schema redesign.


Prompt 3 — Add the USDA FoodData Central ingestion layer
Implement a USDA FoodData Central adapter and normalized food catalog pipeline.

Build:
- A typed server-only USDA client.
- Search endpoint: GET /api/foods/search?q=
- Food import endpoint/service for a chosen FDC food ID.
- Food detail endpoint returning normalized nutrients, portions, tags, provenance,
  data-quality state, and image metadata if available.
- A seed/import script for an initial curated catalog of approximately 100 staple foods.

Prioritize Foundation Foods and SR Legacy foods for generic ingredients.
Do not rely on branded entries as proof of micronutrients unless the relevant nutrient
is actually present in source data.

Normalize:
- Food name, scientific/common names where present, FDC ID, food category,
  preparation state, edible portion assumptions, and per-100g nutrients.
- Important nutrient aliases such as folate DFE, vitamin A RAE, vitamin E alpha-tocopherol,
  vitamin D, choline, ALA, EPA, and DHA.
- Missing nutrient values as missing, never zero.

Implement caching, retry/backoff, bounded request timeouts, and idempotent imports.
Persist raw source metadata sufficient to trace every number shown to a user.

Tests:
- Mocked FDC API contract tests.
- Import idempotency tests.
- Tests that protein, vitamin E, and choline appear correctly for selected fixture foods.
- Tests that absent iodine/choline data stays “missing,” not zero.

Acceptance criteria:
- A user can search for “salmon,” “kale,” “Greek yogurt,” and “wheat germ oil.”
- Selected foods display source-backed nutrient data per 100 g.
- No live external API calls occur during CI.


Prompt 4 — Create the nutrient calculation and proof engine
Implement the pure TypeScript nutrition engine in packages/domain.

Build functions for:
- Portion conversion from grams and supported household measures.
- Nutrient calculation: per-100g source value × selected grams / 100.
- Meal aggregation.
- Day aggregation.
- Week aggregation.
- Nutrient status evaluation against min/target/max/tolerance.
- Top nutrient contributors by food.
- Source provenance output for every calculated nutrient.
- Human-friendly unit formatting without losing calculation precision.

Define a stable proof response shape:
- nutrient key
- target settings
- consumed amount
- percentage of target
- status: met / under / over / unknown
- confidence/data completeness
- top contributing ingredients
- source references

Important:
- Do not round before calculating.
- Do not claim a target is met when essential contributing data are missing.
- Preserve raw values, then separately compute display values.
- Treat calories, macros, and micronutrients with the same canonical pipeline.

Tests:
- Unit tests for every conversion.
- Golden tests using fixed food/portion fixtures.
- Property tests for linear scaling: doubling grams doubles known nutrients.
- Tests that missing data propagates as unknown rather than zero.
- Snapshot tests for the proof-table response.

Acceptance criteria:
- A sample day produces an explainable nutrient proof map.
- The displayed proof values reconcile exactly with raw ingredient calculations.


Prompt 5 — Build the optimization solver service
Implement the first Python optimization service in services/solver using FastAPI,
Pydantic, OR-Tools, and pytest.

Expose:
POST /solve

Input:
- candidate foods with normalized per-100g nutrient vectors
- meal roles and meal templates
- allowed portion ranges and gram increments
- pantry status and pantry quantities
- hard bans and dietary filters
- nutrient min/target/max settings
- calorie and macro constraints
- locked meals and locked ingredients
- random seed
- objective weights

Output:
- selected foods and portions by meal
- objective score and solver metadata
- hard-constraint result
- nutrient totals
- diagnostic data
- infeasibility explanation when no valid solution exists

Solver design:
- Use 5g or 10g portion increments initially.
- Enforce food-category plausibility and portion caps.
- Prevent absurd meal plans such as huge oil/seed quantities.
- Require meal templates such as protein + produce + carbohydrate where appropriate.
- Prefer pantry foods, then lower food count, then variety, then smaller nutrient deviation.
- Support a time budget and deterministic seed behavior.
- Return selected foods/grams only; TypeScript remains the canonical proof calculator.

Implement two solve modes:
1. strict solve: all hard constraints must pass.
2. diagnostic relaxed solve: minimize violations and identify the smallest likely settings
   to loosen or ingredients/restrictions to change.

Tests:
- Solver fixture that finds a valid one-day plan.
- Impossible vegan-plus-no-legume-plus-no-fortified-food scenario returns useful diagnostics.
- Banned foods are never selected.
- Same seed produces equivalent output.
- Locked foods remain present after solving.

Acceptance criteria:
- The service produces three meal groups and valid portions.
- Infeasibility is never reported solely because a timeout occurred.
- The solver contract is documented through OpenAPI and generated into the TS client.


Prompt 6 — Create the plan-generation API and persistence flow
Implement the Next.js server-side planner orchestration layer.

Create:
- POST /api/plans/generate
- GET /api/plans/:planId
- POST /api/plans/:planId/save
- POST /api/plans/:planId/duplicate
- GET /api/plans/:planId/proof

Generation flow:
1. Validate user settings with Zod.
2. Resolve available foods from pantry, curated catalog, and allowed shopping foods.
3. Filter banned foods and dietary restrictions before solver input.
4. Send normalized candidates and goals to the solver.
5. Independently recompute nutrient proof in TypeScript.
6. Reject solver output if proof verification fails.
7. Persist a plan revision with immutable food and nutrient snapshots.
8. Return meals, portions, proof, warnings, and diagnostics.

Add a candidate-selection layer so the solver never receives the entire food database.
Start with a curated food pool plus pantry foods, ranking candidates by nutrient deficits,
dietary eligibility, meal role, and food variety.

Tests:
- API integration test for a successful plan.
- API integration test for a verified proof response.
- Test that a solver output inconsistent with TypeScript calculations is rejected.
- Test persistence snapshots remain stable after catalog updates.
- Test invalid settings return structured validation errors.

Acceptance criteria:
- A client can generate, inspect, save, duplicate, and reload a day plan.
- Every returned plan includes its proof and source traceability.


Prompt 7 — Build the first usable planner UI
Build the initial web experience in apps/web.

Pages:
- /planner/new
- /planner/[planId]
- /foods
- /settings/nutrition

Build a polished responsive planner UI inspired by the attached nutrient-map layout
(docs/assets/plan-view-reference.jpeg):
- Left nutrient rail with daily goal status.
- Breakfast, lunch, and dinner sections.
- Ingredient cards with quantity, nutrient highlights, and thumbnail placeholder.
- A daily proof table with target, actual, percent, status, and contributors.
- “Generate plan” action.
- Editable calories, macros, and nutrient settings.
- Toggle per nutrient: disabled / min / target / max.
- Clear display of missing-data warnings.
- Accessible mobile layout using collapsible nutrient and meal sections.

Important UX rules:
- Never rely only on color to convey under/over/met status.
- Show grams as the calculation unit and friendlier serving language where supported.
- Clearly distinguish “ignored nutrient” from “maximum of zero.”
- Show whether an ingredient came from pantry or needs shopping.

Tests:
- Component tests for nutrient settings and proof table.
- Playwright flow: create settings -> generate day plan -> inspect proof -> save plan.
- Accessibility checks for keyboard navigation and visible focus.

Acceptance criteria:
- A user can generate a day plan without leaving the browser.
- The nutrient proof visibly reconciles the meal ingredients with daily goals.


Prompt 8 — Pantry, banned foods, and dietary restriction engine
Implement pantry and food-rule management.

Pages:
- /pantry
- /settings/food-rules

Features:
- Search/import USDA foods into pantry.
- Enter pantry quantity in grams or supported household units.
- Mark food as unlimited, limited quantity, or unavailable.
- Pantry modes: pantry-only, prefer-pantry, pantry-plus-shopping.
- Custom banned foods.
- Dietary presets: vegan, vegetarian, pescatarian, nondairy, paleo, keto, whole-foods.
- Explicit user overrides for food classification where taxonomy is ambiguous.
- Explain why a food was excluded from a plan.

Implement a composable restriction engine:
- hard bans always win
- allergy/banned food rules override dietary presets
- dietary presets compile into food-tag rules
- keto is macro-constraint plus food-policy behavior
- whole-foods excludes foods marked heavily processed
- uncertain classification is surfaced instead of silently assumed safe

Tests:
- Vegan never returns animal foods.
- Nondairy never returns milk/yogurt/cheese tagged foods.
- Pescatarian allows fish but excludes poultry and red meat.
- Pantry-only never recommends a missing ingredient.
- A banned ingredient cannot re-enter through shuffle or substitution.

Acceptance criteria:
- Users can build a pantry and generate plans from it.
- The plan clearly identifies pantry usage versus shopping requirements.


Prompt 9 — Implement shuffle, swap, locks, and re-solving
Add interactive editing and re-optimization to saved and draft plans.

Features:
- Lock/unlock an ingredient.
- Lock/unlock a meal.
- Shuffle a meal.
- Shuffle an individual ingredient.
- Replace an ingredient through search.
- Re-solve remaining meals around the user’s chosen replacement.
- Show a before/after nutrient diff before committing.
- Preserve reproducible randomization with saved solver seeds.
- Save every material change as a PlanRevision.

Behavior:
- Ingredient shuffle should first search alternatives with the same meal role and
  comparable culinary purpose.
- A replacement must honor bans, dietary restrictions, pantry mode, and all locked items.
- Re-solving should minimize changes to untouched meals.
- Never silently alter a locked ingredient.
- If a chosen replacement makes the plan infeasible, show the exact affected constraints
  and proposed adjustments.

Tests:
- Locked ingredient survives meal shuffle.
- Ingredient replacement preserves hard nutrient constraints when feasible.
- Infeasible replacement returns a useful explanation.
- Banned food cannot be reintroduced.
- Same seed and same locks yield deterministic results.

Acceptance criteria:
- A user can replace salmon with another approved protein and receive a corrected plan.
- The UI clearly explains what changed nutritionally and why.


Prompt 10 — Add weekly planning, macro cycling, and variety
Extend the planner from one day to 1–4 week horizons.

Support:
- Plan duration in weeks.
- Daily or aggregate weekly calorie budgets.
- Daily or aggregate weekly macro targets.
- Varying daily targets, such as high-protein training days and lower-calorie rest days.
- Minimum variety rules: max repeats per week, avoid repeating the same dinner on
  consecutive days, minimum number of unique vegetables/proteins.
- Ingredient availability and pantry depletion across days.
- Weekly nutrient rollups plus daily compliance views.
- Seeded randomization across the plan horizon.

Implementation:
- Build a multi-day planner orchestration strategy.
- Start with daily solves plus cross-day penalties/backtracking.
- Keep the API extensible for future joint multi-day optimization.
- Persist plan duration, daily targets, weekly targets, variety settings, and solver seed.
- Warn when daily targets are impossible but weekly averages could still be achieved.

Tests:
- Generate seven-day plan with no repeated dinner on adjacent days.
- Pantry quantity is not exceeded across the week.
- Weekly calories and macros reconcile with day totals.
- Same settings and seed produce the same plan.
- Impossible weekly restriction configuration produces an actionable diagnostic.

Acceptance criteria:
- A user can generate a varied one-week plan with daily proof and weekly rollup.


Prompt 11 — Shopping lists, saved plans, and print layouts
Implement shopping, saved-plan management, and printable output.

Build:
- /plans saved-plan library with search, duplicate, archive, and revision history.
- Shopping list generation across a selected plan horizon.
- Group shopping list by grocery category.
- Aggregate ingredient grams across all meals.
- Subtract tracked pantry quantities.
- Mark pantry items with unknown quantity as “check pantry” rather than subtracting them.
- Checkboxes and manual overrides for shopping list items.
- Print view optimized for Letter and Legal paper.
- Meal-plan print layout with day, meals, ingredients, portions, nutrient proof summary,
  warnings, and shopping list.

Keep print rendering serverless-friendly:
- Use CSS @media print initially.
- Add downloadable PDF only if it can be generated reliably without a fragile browser dependency.

Tests:
- Shopping list aggregation and pantry subtraction.
- Unit conversion edge cases.
- Saved-plan revision-history integration test.
- Playwright print-route screenshot test.
- Print view does not show editing controls.

Acceptance criteria:
- A user can print a complete week plan.
- Shopping list totals reconcile with every meal ingredient in the plan.


Prompt 12 — Nutrient education and image system
Build nutrient-detail experiences and a safe food-thumbnail system.

Pages:
- /nutrients
- /nutrients/[nutrientKey]

For each nutrient page show:
- What the nutrient is.
- Why it matters.
- Default recommendation source and unit.
- Upper limit when applicable.
- Symptoms/medical claims must be editorially reviewed and clearly sourced.
- Foods in the local catalog highest in that nutrient.
- The user’s current plan contribution and top sources.
- Data completeness caveats.

Implement:
- Nutrient content stored as structured editorial records with source citations,
  version dates, and review status.
- Food-image model with image URL, alt text, license, source, attribution,
  crop metadata, and fallback category illustration.
- A curated initial image set only for common foods.
- Neutral generated SVG/category placeholders for missing images.
- No scraped, hotlinked, or license-unknown imagery.

Tests:
- Nutrient page loads source-backed data.
- Food ranking uses actual per-100g values.
- Images without license metadata fall back to placeholders.
- Accessibility tests for alt text.

Acceptance criteria:
- A user can click “Vitamin E” in a plan and understand their target, current intake,
  top contributing foods, and other catalog foods rich in it.


Prompt 13 — Authentication, deployment, observability, and final hardening
Productionize the app.

Implement:
- Better Auth or Auth.js with Neon/Postgres persistence.
- Migration from demo user ownership to authenticated user ownership.
- Row-level authorization checks in every plan, pantry, food-rule, and shopping endpoint.
- Prisma + Neon production connection setup.
- Vercel deployment configuration for apps/web.
- Docker deployment configuration for services/solver, compatible with Cloud Run.
- Secure service-to-service authentication between web and solver.
- Environment validation and secret handling.
- Structured logs with request IDs.
- Error boundaries and user-safe error messages.
- Rate limiting for food search, plan generation, and solver requests.
- Health checks and readiness checks.
- Scheduled/import-safe USDA refresh workflow.
- Database backup and migration runbook.
- Performance budget for day-plan generation and weekly-plan generation.
- Production CI/CD with preview deployments and migration safeguards.

Add a final test suite:
- Full Playwright happy path.
- Authorization isolation between two users.
- Solver outage handling.
- USDA timeout handling.
- Accessibility audit on planner and print views.
- Load test for concurrent generation requests.
- Contract test between Next.js and FastAPI.

Acceptance criteria:
- A new user can sign up, create a pantry, generate a plan, shuffle an ingredient,
  save a week, print it, and generate a shopping list.
- No user can access another user’s plans or pantry.
- Every plan remains explainable and source-traceable after deployment.
