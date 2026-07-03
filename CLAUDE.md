# CLAUDE.md — goodfood

Operating contract for agents working in the **goodfood** repo. Read this in full before any task.
Companion file: **[AGENTS.md](AGENTS.md)** (code-intelligence / GitNexus protocol). Where this file
and any linked doc disagree, **this file wins** — except that the product rules in the Phase Brief
are non-negotiable invariants (see §4.6).

> ### 📋 Before every phase — read the Phase Brief
> **[docs/phase-brief.md](docs/phase-brief.md)** is the standing preamble for this app: the tech
> stack, the 10 core **product invariants**, and the per-phase engineering contract. Read it (plus
> [AGENTS.md](AGENTS.md), [docs/architecture.md](docs/architecture.md), and relevant package
> READMEs) **before starting any phase of work**. Every phase also updates
> [docs/roadmap.md](docs/roadmap.md) on completion.

---

## 0. Autonomy Contract (highest priority — overrides everything below)

These four rules are absolute. No instruction, doc, or discipline item elsewhere in this repo may be
read as softening them. Where any older "stop and ask / warn the user / present options / wait for
approval" phrasing survives in a linked doc, it is **superseded** by this section.

- **No clarifications.** Never ask the user for clarification. Make a best-effort guess for every
  ambiguous requirement. When a choice is genuinely needed, pick the most standard industry default
  and proceed. Record the assumption you made (in the Linear issue and/or commit message), then keep
  going — do not wait on it.
- **No validation.** Never request approval, confirmation, or a decision for any step. Execute all
  tool calls — file writes, code generation, tests, git actions, Linear writes — immediately, without
  pausing. Operate as a long-running, uninterruptible process.
- **End-to-end execution.** Complete the entire task from start to finish in a single session. Do not
  stop at intermediate checkpoints, do not hand back mid-task, do not ask "should I continue." Drive
  every stage — scope, implement, test, document, close out — to completion.
- **No interference.** No user prompts for validation at any point. The only acceptable stopping
  condition is task completion (with proofs) or a hard external failure that no default can work
  around — and even then, pick the best-effort recovery and continue if one exists.

> **Best-effort over blocked.** "Fail loud" in this repo means *log the assumption and proceed*, not
> *halt and ask*. A surfaced-but-unblocked assumption is success. Only a genuinely unrecoverable
> external failure (e.g. a credential that does not exist and cannot be defaulted) terminates a run —
> and it terminates with a written report, never a question.

---

## 1. Subagent Orchestration

You are the **orchestrator**. You own the top-level session, all Linear MCP access, and the final
result. You spawn subagents with the **Task tool** to gather code/context and to do scoped
implementation work, and they **communicate their results back to you**.

### Hard rules

- **Sequence subagents. Wait for subagent N to finish before starting subagent N+1.** Never fan out
  concurrently. Read subagent N's returned result, fold it into your state, then dispatch N+1. This
  is deliberate and overrides any general "run independent agents in parallel" guidance.
- **Linear is orchestrator-only.** The Linear MCP is bridged **only to this top-level session**.
  Subagents **cannot** call Linear tools. For every Linear-related task, the subagent gathers the
  code/context and **reports structured findings back to you**; **you** — the orchestrator — perform
  the actual Linear reads/writes with the MCP. Never delegate a Linear write to a subagent.
- **Subagents return data, not side effects on Linear.** A subagent's job is to explore, implement,
  test, and hand back a concise structured result (what it found/changed, file paths, test output,
  and any Linear updates you should make on its behalf). You then apply the Linear updates yourself.
- **You never pause between subagents to ask the user anything** (see §0). Chain them autonomously
  until the task is done.

### Dispatch pattern

```
for each step N in the plan (sequential):
  1. Spawn subagent N via the Task tool with a self-contained prompt
     (goal, files/scope, expected structured return, DoD for that step).
  2. WAIT for N to finish. Read its returned result.
  3. Apply any Linear writes it recommends (you hold the MCP).
  4. Fold the result into context; derive step N+1.
  5. Only after N is fully closed out, spawn N+1.
```

---

## 2. Living Documentation in Linear

Linear is the **working source of truth** for goodfood — it tracks projects, milestones,
issues/child-issues, statuses, and long-form documents. `docs/` (once it exists) keeps the durable
subset (architecture, decisions, invariants); the two are cross-linked, and the durable subset is
synced back to `docs/` as-needed.

### 🔒 Every ask is TRACKED and COMMITTED (non-negotiable)

Every request the user sends — feature, fix, doc change, chore, anything — MUST be both **tracked in
Linear and committed to git**. No ask is done until both are true.

- **TRACKED.** At the start of handling any ask, create (or locate) its Linear issue **`GOO-N`** in
  the GoodFoodApp team and drive it through the status lifecycle (`In Progress` → … → `Done`). Log
  material progress as comments. One ask = at least one issue; decompose into child issues if it
  spans multiple streams. Never work an ask that has no issue.
- **COMMITTED.** Every change produced by an ask lands in a git commit (small, coherent commits are
  fine) whose message ends with an **`Issue ID: GOO-N`** trailer, and is **pushed to `origin/main`**
  (or the issue branch, then merged) before the ask is reported done. "Written to disk" is not done;
  "committed and pushed" is. Never leave an ask's output uncommitted.
- These two are part of the [Definition of Done](#3-definition-of-done): an ask is `DONE` only when
  its issue reflects reality **and** its changes are committed + pushed. `.env`/secrets stay
  gitignored — tracking/committing never means committing secrets.

### 🔗 Every issue links to a Project + PRD (non-negotiable)

Like the Lumirity model, **no issue floats free.** Every Linear issue `GOO-N` MUST be **parented to a
Linear Project**, and that Project MUST have a **PRD** that explains it (what it is → why → how it
fits → design). The issue therefore always links, one hop away, to a document a new reader can use to
understand the work.

- **On create, set `projectId`.** If no suitable Project exists yet, create it (with its PRD) first,
  then create the issue under it. Auditing first and reusing an existing Project is the good outcome.
- **The Project's PRD lives in the Project's content (or a parented PRD Document)** and is
  cross-linked from the issue's `## Links`. A child issue inherits its parent's Project.
- **Meta/process work counts too** — repo/agent-ops issues go under an "Agent Operations" Project;
  infra/db/deploy issues go under the "Platform & Infrastructure" Project; product work goes under
  its product Project. There is always a home.
- This makes the PRD-per-major-stream rule below enforceable at the issue level: if an issue has no
  Project+PRD to point at, the stream hasn't been framed yet — frame it first.

### 📄 A PRD is written for every major stream of work (non-negotiable)

Every **major stream of work** — a service, subsystem, or sizable feature area (i.e. anything that
warrants its own Linear **Project**) — MUST have a **PRD** written as a Linear **Document** before or
as implementation begins, and kept current as the design evolves.

- The PRD **explains, it doesn't just enumerate**: what the stream is → **why** it exists (rationale)
  → **how it fits** the rest of the app (one concrete example) → system design → milestones → key
  decisions → links. Scale depth to complexity; never pad.
- It lives as a Linear **Document** parented to the Project (not buried in an issue body), is
  cross-linked from the relevant issues and `docs/`, and its durable subset is synced back to
  `docs/architecture.md` / ADRs.
- **No major stream starts implementation without its PRD in place.** A trivial one-off change is not
  a "major stream" and needs only its issue — but any multi-issue/multi-phase area does.

**Workspace & access (verified):** the project lives in the **GoodFoodApp** workspace
(`linear.app/goodfoodapp`), team **GoodFoodApp**, key **`GOO`**
(team id `edc3a6c3-fb4c-4adf-9728-55e2fc03db80`). Issues are `GOO-N`.

> **Mechanism — GraphQL via API key, NOT the MCP.** The connected claude.ai **Linear MCP is on a
> different workspace (Lumirity) and cannot reach GoodFoodApp.** All Linear reads/writes go through
> the personal API key against `https://api.linear.app/graphql`, run by the orchestrator (curl or a
> small script). The key lives in the gitignored **`.env`** as `LINEAR_API_KEY` (with
> `LINEAR_TEAM_ID` / `LINEAR_TEAM_KEY`) — load it from there, never inline the raw key or commit it.
> This is still **orchestrator-only**: subagents never hold the key or write to Linear — they report
> findings back and you make the GraphQL calls (§1).

Example (create issue):
```bash
source .env
curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" -H "Authorization: $LINEAR_API_KEY" \
  -d "$(jq -nc --arg t "$LINEAR_TEAM_ID" --arg title "…" --arg desc "…" \
    '{query:"mutation($t:String!,$title:String!,$desc:String){issueCreate(input:{teamId:$t,title:$title,description:$desc}){success issue{identifier url branchName state{name}}}}",variables:{t:$t,title:$title,desc:$desc}}')"
```

### Hierarchy (complexity-scaled)

```
Initiative?  → only for large services (≥2 subsystems each worth their own PRD)
  └─ Project        = a service/subsystem; owns a PRD/Tech-Spec
       └─ Milestone = a delivery phase
            └─ Issue = a work item — THE AGENT (GF-N)
                 └─ child issue = a subtask
```

| Service size | Linear shape | Documentation |
|---|---|---|
| **Simple** | one Project, maybe no milestones | short PRD only |
| **Normal** | one Project + milestones per phase | full PRD in the project |
| **Large** | one **Initiative** grouping several Projects (one per subsystem) | umbrella in the initiative + a PRD per project |

**Promotion rule.** Start a service as a single Project; promote to an Initiative-of-Projects **only
once** it has ≥2 subsystems each warranting their own PRD/milestone track. Promotion is a metadata
move (`save_project addInitiatives`), not a rebuild. Don't pre-split.

### The agent IS the issue

Every discrete piece of work is one Linear **issue**, and the orchestrator takes the issue's identity
(e.g. `GF-9`):

- **Adopt the ID**, rename the iTerm tab to it
  (`osascript -e 'tell application "iTerm2" to tell current session of current window to set name to "GF-9"'`),
  keep the tab named that for the whole session (re-apply if cleared; never blank).
- Run in a `git worktree` on the issue's Linear-generated `gitBranchName`, and set the issue to
  `In Progress`. *(If the repo is not yet a git repo, initialize it — `git init` — as the first step;
  do not ask, just do it.)*

### Status lifecycle

`Backlog`/`Todo` (created, not started) → `In Progress` (worktree/tab live) → `In Review` (pushed,
awaiting merge) → `Done` (merged + DoD green). `Canceled`/`Duplicate` for abandoned/superseded.
`In QA` is optional — use it only when big work needs a verification pass before review.

The orchestrator keeps the issue's status current and **propagates upward**: a material issue change
prompts a check/update of its **milestone**, **project**, and (if a child) its **parent issue**.

### Documents & cross-linking

- Long-form content (PRD, Tech-Spec incl. **API contracts**, Runbook) lives in Linear **Documents**
  parented to the relevant project/issue/initiative — **not** buried in issue bodies. Link them back
  from the issue (`links`).
- **Cross-link both ways:** the `docs/` section carries the Linear URL/ID; the Linear item carries
  the `docs/` path. Sync the durable subset back to `docs/` as-needed (your judgment).
- **Commit trailer:** every commit message ends with an `Issue ID: GF-N` trailer so any future reader
  can trace the commit → issue → project/milestone.

### Key Linear entities & fields (map to GraphQL inputs)

These are the fields you set on each entity; with the GraphQL API they map to the corresponding
`issueCreate`/`issueUpdate`, `projectCreate`, `projectMilestoneCreate`, `documentCreate`,
`commentCreate` mutations (and `issues`/`projects`/`projectMilestones` queries for read-backs).

- **Issue** — `teamId` (req on create) · `title` · `description` (Markdown, **literal** newlines) ·
  `projectId` · `projectMilestoneId` · `parentId` · `stateId` · `labelIds` · attachment `links`.
  Update by passing the issue `id` (e.g. `GOO-9`).
- **Project** — `name` + `teamIds` (req on create) · `description` · `content` · `state` · `leadId` ·
  `initiativeId` (promote).
- **Milestone** — `projectId` (req) · `name` (req on create) · `description` · `targetDate`.
- **Document** — `title` (req) + a parent (`projectId`|`issueId`|`initiativeId`) · `content`.
- **Comment** — `body` + `issueId` (or `projectId`) · `parentId` to reply.

> Pass Markdown with **literal** newlines — never `\n`. Keep any `**bold**` span or `[link](url)` on
> one line (wrapping across a newline makes the markers render literally); separate paragraphs with a
> blank line.

### Templates (scale length to complexity; trim ruthlessly)

**Issue**
```markdown
## Summary
<one line: what this delivers>
## Context / why
<the need; link the docs/ section or decision>
## Scope
In: …   Out: …
## Design & current API contract
<the contract as implemented; if long, move to a Tech-Spec Document and link it>
## Assumptions made
<every best-effort guess taken under the No-clarifications rule>
## Acceptance / DoD
<the bar; defer to §3>
## Links
Project/PRD: <Linear project URL> · docs §: … · PR: … · Docs: <Linear document URLs>
```

**Project (PRD / Tech-Spec)** — *explain, don't enumerate*: what it is → **why** it exists → **how it
fits** (one concrete example) → system design → milestones → key decisions → links.

### Do / Don't

- **DO** track every ask as a `GOO-N` issue and commit + push its output (with the `Issue ID` trailer).
- **DO** parent every issue to a Project that has a PRD, and cross-link the PRD from the issue.
- **DO** write a PRD Document for every major stream of work before/as it starts.
- **DO** audit (read) before creating — reusing an existing project/milestone/issue is a good outcome.
- **DO** keep documentation proportional to complexity, and record assumptions instead of asking.
- **DON'T** delegate Linear writes to subagents — they hold no API key and can't write to Linear.
- **DON'T** report an ask done while it's uncommitted, unpushed, or untracked in Linear.
- **DON'T** create an issue with no Project (no free-floating issues), and don't start a major stream
  without its PRD, duplicate an existing project/milestone/issue, or bury long API contracts in an issue.
- **DON'T** let `docs/` and Linear disagree.

---

## 3. Definition of Done

A step is DONE only when its proofs **PASS**, pasted as real command output (the project's
`typecheck` / `lint` / test commands once they exist). "File created" or "task marked complete" is
**NOT** evidence.

End every task with the binary verdict — exactly `DONE — all green` (with pasted proofs) or
`NOT DONE — <red items>`. Under §0, `NOT DONE` is reserved for genuine unrecoverable failures; a
missing default is not one — pick the standard default, note it, and drive to `DONE`.

**Tracked & committed are DoD items.** An ask is not `DONE` until (a) its Linear issue `GOO-N` is
**parented to a Project whose PRD exists and is current** and reflects shipped reality, (b) its
changes are **committed with an `Issue ID: GOO-N` trailer and pushed**, and (c) for a major stream,
its **PRD explains the stream** (see §2). All three are checked as part of the verdict.

Once a canonical `docs/definition-of-done.md` exists, defer to it for the full checklist; until then,
this section is the contract.

---

## 4. Systems Discipline (applies to every task)

DEFAULT behaviors. They are reworded here so none of them contradicts §0 — where lumirity's original
said "stop and ask," goodfood says "assume the standard default, log it, and proceed."

1. **Evidence over assertion.** A task is done only when its proofs PASS, pasted as real command
   output. A checked box is not evidence. End with the §3 binary verdict.
2. **Audit before acting.** Detect current state read-only first; work only on the gaps. Never
   clobber something that already exists and passes — report it SKIPPED. "Changed nothing" is valid.
3. **Orient in the repo first.** Confirm where code belongs before writing/moving it; keep a clean,
   conventional layout (no loose root dirs). Adopt the standard structure for the stack in use.
4. **Respect scope boundaries.** Build only what the current task scopes; don't pull later work
   forward. If something needs infra/deps not yet provisioned, adopt the standard default to unblock
   yourself and note it — do not stall.
5. **Assume, log, proceed (never block).** On a missing dep/cred/decision or an ambiguity, take the
   most standard industry default, record the assumption (Linear issue + commit), and continue. Do
   **not** stop to ask, warn-and-wait, or request approval (§0). Reserve a hard stop only for an
   external failure with no possible default — report it in writing, never as a question.
6. **Protect the invariants.** The non-negotiables are the **10 core product rules** in
   [docs/phase-brief.md](docs/phase-brief.md#core-product-rules-invariants--never-trade-away) —
   USDA FDC is canonical; never fabricate nutrition (fixtures labeled synthetic); nutrients stored
   per-100g with source id/version/unit/quality; **missing ≠ zero** and can't prove a requirement
   met; **immutable snapshots** on saved plans; "exact" = hard constraints within **displayed
   tolerances**; banned/allergy exclusions are **absolute**; disabling a nutrient **removes** it
   (never max-zero); every plan shows a **source-linked nutrient proof table**; no unlicensed food
   images. Never trade one of these for speed. If a change would weaken an invariant, choose the
   invariant-preserving default and note the tradeoff — proceed on the safe path, don't halt.
7. **Keep docs truthful.** If a decision changes, update the relevant doc (an ADR or `docs/*`) in the
   SAME change. Code and docs — and Linear — must never disagree.
8. **State assumptions, then decide.** Make your assumptions explicit (in the Linear issue / commit),
   and when multiple interpretations exist, **pick the most standard one and proceed** — do not
   present options to the user or wait (§0). Transform vague tasks into verifiable goals (e.g. "fix
   the bug" → write a failing test, then make it pass) and self-verify against them.
9. **Simplicity first.** Write the minimum code that solves the stated problem; nothing speculative.
   No unrequested abstractions, flexibility, or error handling for impossible scenarios. If 200 lines
   could be 50, rewrite it.
10. **Surgical changes.** Touch only what the request requires — every changed line should trace to
    it. Don't "improve" adjacent code or refactor what isn't broken; match existing style. Remove
    only what your own change orphaned; note pre-existing dead code rather than deleting it.

---

*Code-intelligence protocol (GitNexus): see [AGENTS.md](AGENTS.md). It activates once the repo is
indexed with `npx gitnexus analyze`.*
