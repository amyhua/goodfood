# AGENTS.md — goodfood

Portable agent guide for the **goodfood** repo. Covers the code-intelligence protocol (GitNexus) and
mirrors the operating contract. The authoritative operating rules live in **[CLAUDE.md](CLAUDE.md)**;
where the two disagree, **CLAUDE.md wins**. The Autonomy Contract in CLAUDE.md §0 (no clarifications,
no validation, end-to-end, no interference) governs everything here too.

---

> **Before editing anything, read [docs/phase-brief.md](docs/phase-brief.md)** — the standing
> preamble with the tech stack, the 10 non-negotiable **product invariants**, and the per-phase
> engineering contract — plus [docs/architecture.md](docs/architecture.md) and relevant package
> READMEs. Update [docs/roadmap.md](docs/roadmap.md) at the end of every phase.

## Operating contract (summary — full text in CLAUDE.md)

- **Autonomy.** Never ask for clarification or approval. Make best-effort guesses using standard
  industry defaults, log them, and proceed. Run end-to-end, uninterruptible, in a single session.
- **Orchestration.** The top-level session is the orchestrator. Spawn subagents with the **Task
  tool**, **sequentially** — wait for subagent N to finish and report back before starting N+1.
- **Linear is orchestrator-only.** Subagents cannot write to Linear; they gather code/context and
  report structured findings back to the orchestrator, which performs all Linear reads/writes via the
  GraphQL API key.
- **Every ask is TRACKED and COMMITTED.** Each user request becomes a Linear issue (`GOO-N`) and its
  output is committed with an `Issue ID: GOO-N` trailer and pushed — an ask is not done until both
  are true (secrets stay gitignored). See CLAUDE.md §2/§3.
- **A PRD per major stream.** Every service/subsystem/sizable feature area (its own Linear Project)
  gets a PRD Document before/as implementation begins, kept current. See CLAUDE.md §2.
- **Every issue links to a Project + PRD.** No free-floating issues — each `GOO-N` is parented to a
  Linear Project that has a PRD explaining it, cross-linked from the issue. See CLAUDE.md §2.

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

Once indexed, this project is served by GitNexus as **goodfood**. Use the GitNexus MCP tools to
understand code, assess impact, and navigate safely. (The repo is not yet indexed — run
`npx gitnexus analyze` from the project root to build the graph; this section activates afterward.)

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **Run impact analysis before editing any symbol.** Before modifying a function, class, or method,
  run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and note the blast radius
  (direct callers, affected processes, risk level).
- **Run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected
  symbols and execution flows.
- On a HIGH or CRITICAL risk result, choose the invariant-preserving default and **record the
  tradeoff** in the Linear issue and commit, then proceed — do **not** stop to warn-and-wait (per
  CLAUDE.md §0). Never silently ignore the risk; log it and continue on the safe path.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows
  instead of grepping. It returns process-grouped results ranked by relevance.
- For full context on a symbol — callers, callees, execution flows — use
  `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename`, which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.
- NEVER pause to ask the user about a HIGH/CRITICAL result — log the tradeoff and proceed (§0).

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/goodfood/context` | Codebase overview, check index freshness |
| `gitnexus://repo/goodfood/clusters` | All functional areas |
| `gitnexus://repo/goodfood/processes` | All execution flows |
| `gitnexus://repo/goodfood/process/{name}` | Step-by-step execution trace |

## CLI / skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Keeping the index fresh

- **After any significant change, refresh the index** — run `npx gitnexus analyze` from the project
  root (add `--embeddings` to also refresh semantic search) so the knowledge graph matches the code.
  "Significant" = new files/modules, moved/renamed files, added/removed/renamed symbols, or
  non-trivial refactors — not typo-level edits. Do this as part of finishing the change, before
  reporting it done — without pausing to ask.
- Also refresh whenever a GitNexus tool or hook warns the index is **stale**.
