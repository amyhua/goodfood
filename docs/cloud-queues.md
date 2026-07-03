# Cloud queue registry

Durable index of every long work-queue launched in the cloud (claude.ai/code). **Register each queue
here** so it can be retrieved later, independent of whether the cloud session is still open. Because
every phase is committed to GitHub and tracked in Linear, this registry + the parent Linear issue +
`git log` are all you need to pick a queue back up from any machine.

How to launch a queue: on your own machine via
[docs/self-hosted-runs.md](self-hosted-runs.md) (`scripts/run-queue.sh`), or in the cloud via
[docs/cloud-run-template.md](cloud-run-template.md).

| Queue name | Date | Host | Linear parent issue | Session / tmux | Status |
|------------|------|------|---------------------|----------------|--------|
| goodfood-build | 2026-07-03 | Elgin-1 | [GOO-14](https://linear.app/goodfoodapp/issue/GOO-14/queue-goodfood-build) | goodfood-goodfood-build | In Progress |
| goodfood-followups | 2026-07-03 | elga-1 | [GOO-23](https://linear.app/goodfoodapp/issue/GOO-23/queue-goodfood-followups) | goodfood-goodfood-followups | In Progress |

## Fields

- **Queue name** — short handle for the batch of phases (e.g. `foundation-scaffold`).
- **Date** — when it was launched (YYYY-MM-DD).
- **Host** — where it runs: a Mac mini's Tailscale name (self-hosted) or `claude.ai/code` (cloud).
- **Linear parent issue** — the `Queue: <name>` tracking issue (`GOO-N`); its checklist + child
  issues are the source of truth for progress.
- **Session / tmux** — the claude.ai/code session URL, or the `tmux` session name on the host
  (`goodfood-<queue-name>`). May go stale; the Linear parent + git history do not.
- **Status** — `In Progress` · `Complete` · `Paused` · `Abandoned`.

## Retrieving a queue later

1. Open its **Linear parent issue** to see which phases are Done / remaining.
2. `git pull` and check `git log --grep "Issue ID: GOO-"` for shipped phases.
3. To resume live in the cloud session: `claude --teleport <session-id>` (from the session URL), or
   open it at claude.ai/code. If the session is gone, start a fresh cloud session pointed at the
   remaining phases from the parent issue's checklist.
