# Phase Brief — read before every phase

> **This is the standing preamble for the goodfood app.** Read it in full before starting any phase
> of work, alongside [AGENTS.md](../AGENTS.md), [docs/architecture.md](architecture.md), and the
> relevant package READMEs. It is the single source of truth for the stack, the product invariants,
> and the per-phase engineering contract. It is governed by [CLAUDE.md](../CLAUDE.md) — where the
> Autonomy Contract (CLAUDE.md §0) and this brief interact, autonomy wins on *process* (never pause
> to ask) and this brief wins on *product correctness* (the rules below are non-negotiable).

You are implementing an incremental, production-quality nutrition meal-planning web app.

## Tech

- pnpm monorepo + Turborepo
- Next.js App Router, TypeScript **strict** mode, Tailwind CSS
- Neon PostgreSQL + Prisma
- Python 3.12 + FastAPI + OR-Tools for optimization
- Vercel hosts the Next.js app; the solver is a separate containerized service
- Zod for API validation, Vitest for TypeScript tests, pytest for Python tests, Playwright for
  end-to-end tests

## Core product rules (invariants — never trade away)

1. **USDA FoodData Central is the canonical nutrient source** for food facts.
2. **Never fabricate nutrition data.** Fixtures must be labeled **synthetic**.
3. Store nutrient values **per 100 g**, source food ID, source version/date, unit, and
   data-quality state.
4. **Missing nutrient data is NOT zero.** It cannot be used as proof that a nutrient requirement is
   met.
5. **Persist immutable nutrition snapshots** on saved plans, so later food-data updates do not alter
   historical plans.
6. **Do not promise literal "exact" nutrition.** Model each nutrient as **disabled / minimum /
   target / maximum**, each with a **tolerance**. "Exact" is shorthand for: *all enabled hard
   constraints satisfied within explicitly displayed tolerances/ranges*. The app's truthful claim is
   **"This plan meets all hard constraints and lands within your chosen target ranges"** — never
   "hits your targets exactly."
7. **Banned foods and allergy exclusions are absolute constraints.**
8. A user **disabling a nutrient removes it from optimization**; it does **not** set its maximum to
   zero.
9. Every generated plan must show a **source-linked nutrient proof table**.
10. **Do not scrape or hotlink unlicensed food images.**

## Engineering rules (per-phase contract)

- Read [AGENTS.md](../AGENTS.md), [docs/architecture.md](architecture.md), and relevant package
  READMEs **before editing**.
- Make the **smallest coherent change** that completes this phase.
- Use **migrations**; do **not** reset or destroy databases.
- Add **tests for all new domain logic and validation**.
- Run **lint, typecheck, unit tests, and relevant E2E tests** before declaring completion.
- Update [docs/roadmap.md](roadmap.md) with what changed, remaining gaps, and migration notes.
- **At completion, report:** changed files, migrations, tests run, results, and manual QA steps.
