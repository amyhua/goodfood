# ADR-002 — Optimization approach

- **Status:** Accepted (Prompt 0, 2026-07-03)
- **Linear:** GOO-15 · Project: Nutrition Meal Planner
- **Invariants:** phase-brief rules 6, 7, 8, 9

## Context

We must select foods and gram portions across meals so that enabled nutrient constraints, calorie/macro
budgets, dietary restrictions, and pantry limits are satisfied — deterministically, explainably, and
without ever claiming false precision or fabricating data.

## Decision

- **Engine:** Python **OR-Tools CP-SAT** in a separate **FastAPI** service (`services/solver`),
  containerized and independent of the web app. Integer decision variables = grams per candidate food
  per meal, on **5 g / 10 g increments** initially.
- **Constraints:**
  - Banned foods & allergy exclusions are **absolute** — filtered out *before* the solver receives
    candidates (rule 7); the solver cannot select them.
  - **Disabling a nutrient removes its term/bound entirely** (rule 8) — it is not modeled as a
    zero-max.
  - Nutrient `minimum`/`target`/`maximum` become lower/band/upper bounds within displayed tolerances
    (rule 6). Calorie/macro budgets are bounds. Portion caps + food-category plausibility prevent
    absurd plans (e.g. huge oil/seed quantities). Meal templates (protein + produce + carbohydrate)
    where appropriate.
- **Objective (lexicographic-ish, weighted):** prefer pantry foods → fewer distinct foods → more
  variety → smaller nutrient deviation. Deterministic under a fixed **random seed**.
- **Two modes:**
  1. **strict** — all hard constraints must pass.
  2. **diagnostic relaxed** — minimize weighted violations and report the smallest set of
     settings/restrictions to change to become feasible.
- **Timeout ≠ infeasible (rule, hard):** a hit **time budget** returns `time_limit` with the best
  feasible solution found; infeasibility is only claimed when the relaxed model proves no solution
  exists.
- **Division of responsibility:** the solver returns **only selected foods + grams + diagnostics**.
  **TypeScript (`packages/nutrition`) is the canonical proof calculator** (rule 9) and independently
  verifies solver output; inconsistent output is **rejected**.
- **Contract:** documented via **OpenAPI**, generated into the typed TS client (`packages/api-client`).

## Consequences

- Web and solver scale/deploy independently; the solver has no DB or secret access.
- Determinism (seed) enables reproducible shuffles and testable behavior.
- Double-computation (solver picks, TS proves) is intentional defense-in-depth against a wrong solver.

## Alternatives considered

- **LP/MILP via PuLP/CBC** — viable, but CP-SAT handles the integer/gram + logical (meal-template,
  variety) constraints more naturally and ships with OR-Tools. Chosen.
- **Greedy/heuristic in TS only** — no separate service, but weak at hard multi-nutrient feasibility
  and infeasibility proofs. Rejected for the core solve.
- **Solver computes the proof** — rejected; keeping proof in TS preserves a single canonical,
  source-linked calculation and guards against solver drift.
