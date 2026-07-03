# Roadmap — goodfood

> Running log of what shipped per phase, remaining gaps, and migration notes. **Every phase updates
> this file** (see [phase-brief.md](phase-brief.md#engineering-rules-per-phase-contract)). Newest
> phase on top. Each entry links its Linear issue (`GOO-N`).

## Status board

| Phase | Linear | State | Summary |
|-------|--------|-------|---------|
| — | — | — | No implementation phases run yet. |

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

- Monorepo scaffolding (apps/web, apps/solver, packages/db|nutrition|contracts) not yet created.
- USDA FoodData Central ingestion not yet implemented.
- Solver service (FastAPI + OR-Tools) not yet implemented.
