# Self-hosted queue runs — always-on Mac mini via Tailscale + tmux

The most robust way to run a long phase queue: an **always-on Mac you own**, reached over
**Tailscale**, running **Claude Code inside a `tmux` session**. You paste (or `cat`) your phase queue,
detach, close your laptop — the run continues on the always-on machine. Reattach later from anywhere
on your tailnet, or ignore the session entirely and read progress from **git + Linear** (every phase
commits + tracks itself).

This is an alternative to [claude.ai/code](cloud-run-template.md). The **prompt is identical** — see
[docs/cloud-run-template.md](cloud-run-template.md); only the launch mechanism differs.

## Why this beats the cloud for us

- **Free & unmetered** — your hardware, no plan limits or session timeouts.
- **Secrets already local** — `.env` lives on the machine; no cloud secret propagation needed for the
  agent run (Vercel deploys still use Vercel env vars).
- **Full trust** — it's your box, so Claude Code can run with permissions relaxed for a truly
  uninterruptible run (see permission modes below).
- **Same retrieval guarantee** — work is committed to GitHub + tracked in Linear regardless of session.

## Registered hosts

| Host | Tailscale IP | SSH | Status |
|------|--------------|-----|--------|
| **elga-1** | 100.73.101.78 | `ssh amy@elga-1` (key auth) | ✅ bootstrapped — Homebrew, node, pnpm, tmux, python@3.12, psql, Claude Code 2.1.x installed; repo cloned at `~/goodfood`; `.env` copied; Neon verified. **Remaining: `claude /login` (interactive, one-time).** |
| nora-2 | 100.78.68.64 | ✗ `Permission denied (publickey)` | not accessible with current key/user — add the SSH key (or user) before it can be a runner |

## One-time setup on the Mac mini

1. **Tailscale** — installed and logged in on both your laptop and the Mac mini (same tailnet). Find
   the machine: `tailscale status`. SSH in: `ssh <you>@<macmini-magicdns-name>` (or its `100.x.y.z`).
2. **Toolchain** — `claude` (Claude Code) installed and authenticated (`claude` once, sign in);
   `tmux` (`brew install tmux`); plus the project toolchain as phases need it (`node`, `pnpm`,
   `python@3.12`, `psql`, Docker for the solver).
3. **Repo** — clone it: `git clone git@github.com:amyhua/goodfood.git && cd goodfood`.
4. **Secrets** — `.env` is **gitignored**, so it is NOT in the clone. Copy it over Tailscale from your
   laptop:
   ```bash
   scp .env <you>@<macmini>:~/goodfood/.env
   # or: tailscale file cp .env <macmini>:   (then move it into ~/goodfood on the mini)
   ```
   Verify: `cd ~/goodfood && grep -c '^LINEAR_API_KEY=' .env` → `1`.

## Launching a queue

Put your filled-in master prompt (from [cloud-run-template.md](cloud-run-template.md)) into a file on
the mini, e.g. `phase-prompts.md`, then:

```bash
cd ~/goodfood
git pull                                   # get the latest docs/rules first
./scripts/run-queue.sh <queue-name> phase-prompts.md
```

`run-queue.sh` starts a **detached tmux session** running Claude Code on that prompt, logging to
`logs/`. It prints the attach command. Then close your laptop — it keeps running on the mini.

**Permission mode (autonomy).** The script defaults to `--permission-mode acceptEdits` (auto-approves
file edits + common commands; may still pause on unusual shell commands). For a **fully hands-off**
run on your trusted machine, launch with `CLAUDE_MODE=yolo` which uses
`--dangerously-skip-permissions` (no prompts at all — only ever on a machine and repo you trust):

```bash
CLAUDE_MODE=yolo ./scripts/run-queue.sh <queue-name> phase-prompts.md
```

## Monitoring & retrieving

- **Reattach (watch/steer):** `ssh <you>@<macmini>` then `tmux attach -t goodfood-<queue-name>`
  (detach again with `Ctrl-b` then `d`).
- **Tail the log without attaching:** `tail -f ~/goodfood/logs/goodfood-<queue-name>-*.log`.
- **List running queues:** `tmux ls`.
- **Independent of the session:** on any machine, `git pull` and open the queue's parent Linear issue
  — all phase issues + commits are there. Register each run in
  [docs/cloud-queues.md](cloud-queues.md) (Host = the mini's name).

## Notes & gotchas

- **`.env` and `&`:** the Neon URLs contain `&`, so `source .env` breaks in bash — Claude Code /
  Prisma / Next.js load `.env` natively and are fine; ad-hoc scripts should use
  `grep '^VAR=' .env | cut -d= -f2-`.
- **Keep it awake:** ensure the mini won't sleep — System Settings → Energy → "Prevent automatic
  sleeping when the display is off" (or `caffeinate -s` inside the tmux window).
- **Auto-start after reboot (optional):** wrap `run-queue.sh` in a `launchd` agent if you want queues
  to resume unattended after a power blip.
