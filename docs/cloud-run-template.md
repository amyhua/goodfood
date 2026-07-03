# Cloud-run prompt template — claude.ai/code

Paste the block below into a **new cloud session at [claude.ai/code](https://claude.ai/code)** (or run
`claude --remote "$(...)"`). Fill the three `<< >>` placeholders, then send it. The session runs in an
Anthropic-managed cloud VM: **close your laptop / kill your terminal and it keeps going.** Retrieve it
later from claude.ai/code, the mobile app, `claude --teleport <session-id>`, or just `git pull` +
Linear (every phase commits + tracks itself, so progress is never lost).

## Prerequisites (one-time)

1. **GitHub connected** — `/web-setup` in the CLI, or sign in at claude.ai/code. Repo:
   `git@github.com:amyhua/goodfood.git`.
2. **Linear secret in the cloud environment** — `.env` is **gitignored and NOT cloned into the cloud
   VM**, so the API key won't be there. In your claude.ai/code **environment settings**, add secrets:
   - `LINEAR_API_KEY` = the GoodFoodApp personal API key
   - `LINEAR_TEAM_ID` = `edc3a6c3-fb4c-4adf-9728-55e2fc03db80`
   - `LINEAR_TEAM_KEY` = `GOO`
   (Plus any per-phase secrets the work needs, e.g. `DATABASE_URL`, `FDC_API_KEY`.)
3. **Register the queue** in [docs/cloud-queues.md](cloud-queues.md) once the session URL exists.

---

## The template (copy from here down)

```
You are implementing the goodfood app AUTONOMOUSLY in a persistent cloud session.

Operate strictly under this repo's CLAUDE.md and AGENTS.md. In particular honor:
- §0 Autonomy Contract — NO clarifications, NO validation/approval, END-TO-END, NO interference.
  Make best-effort standard-default guesses for any ambiguity, log them, and keep going. Never stop
  to ask or wait for confirmation. The only stop condition is queue completion or a genuinely
  unrecoverable external failure (report it in writing, never as a question).
- Sequential subagents — spawn subagents with the Task tool one at a time; do NOT start subagent
  N+1 until N has finished and reported back. You (the top-level session) are the orchestrator and
  own ALL Linear writes (via the LINEAR_API_KEY env secret against https://api.linear.app/graphql).
- Every ask is TRACKED (Linear GOO-N) and COMMITTED (git, `Issue ID: GOO-N` trailer, pushed).
- A PRD is written for every major stream of work (its own Linear Project) before/as it begins.

QUEUE REGISTRATION (do this first, before Phase 1):
- Queue name: << QUEUE NAME >>
- Date: << DATE >>
- Create a PARENT Linear tracking issue in team GOO titled "Queue: << QUEUE NAME >>" whose
  description lists every phase below as a checklist. Each phase becomes a CHILD issue (GOO-N) of it.
- Add a row to docs/cloud-queues.md: queue name, date, parent-issue URL, this cloud session URL,
  status = In Progress. Commit + push that.

FOR EACH PHASE, IN STRICT ORDER (never begin phase N+1 until phase N is fully Done):
1. Read AGENTS.md, docs/phase-brief.md, docs/architecture.md, and any relevant package READMEs.
2. Create/locate the phase's Linear issue GOO-N (child of the queue parent); set it In Progress.
3. If the phase opens a MAJOR STREAM (new service/subsystem/sizable area), write its PRD as a Linear
   Document parented to its Project BEFORE implementing; cross-link it.
4. Make the SMALLEST COHERENT change that completes the phase. Use migrations; never reset/destroy
   databases. Use sequential subagents for scoped code/context gathering.
5. Add tests for all new domain logic and validation. Run lint, typecheck, unit tests, and relevant
   E2E tests. Paste real command output as proof (no green claim without proof).
6. Update docs/roadmap.md (what changed, remaining gaps, migration notes).
7. Commit with an `Issue ID: GOO-N` trailer and push to origin. NEVER commit .env or secrets.
8. Set the issue Done with a completion-summary comment; tick the phase in the queue parent checklist
   and update its row status in docs/cloud-queues.md.
9. Report for the phase: changed files, migrations, tests run + results, manual QA steps. Then move
   to the next phase automatically.

ON QUEUE COMPLETION: set the parent tracking issue Done, mark docs/cloud-queues.md status = Complete,
commit + push, and post a final summary comment listing every GOO-N shipped.

=== PHASE QUEUE (execute in order) ===
<< PASTE YOUR ORDERED SEQUENCE OF PROMPTS HERE — one phase per numbered block >>
Phase 1: ...
Phase 2: ...
Phase 3: ...
```

---

## After you send it

- **Monitor / add notes:** claude.ai/code or the mobile app.
- **Pull it back to your terminal:** `claude --teleport <session-id>`.
- **Retrieve results independently of the session:** `git pull` and open the queue's parent Linear
  issue — all phase issues + commits are there regardless of session state.
