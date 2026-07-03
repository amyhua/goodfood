#!/usr/bin/env bash
# Launch a goodfood phase queue in a detached tmux session on an always-on machine.
# Survives your laptop / SSH disconnecting — runs on THIS machine until the queue completes.
# Usage:   ./scripts/run-queue.sh <queue-name> [prompt-file]
# Example: ./scripts/run-queue.sh foundation-scaffold phase-prompts.md
#          CLAUDE_MODE=yolo ./scripts/run-queue.sh foundation-scaffold phase-prompts.md
#
# CLAUDE_MODE: acceptEdits (default) | plan | auto | yolo (=> --dangerously-skip-permissions)
set -euo pipefail

QUEUE="${1:-}"
PROMPT_FILE="${2:-phase-prompts.md}"
MODE="${CLAUDE_MODE:-acceptEdits}"

if [[ -z "$QUEUE" ]]; then
  echo "usage: $0 <queue-name> [prompt-file]" >&2
  exit 2
fi

# Move to repo root (this script lives in scripts/).
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Preflight checks.
command -v claude >/dev/null 2>&1 || { echo "ERROR: 'claude' (Claude Code) not installed / not on PATH." >&2; exit 1; }
command -v tmux   >/dev/null 2>&1 || { echo "ERROR: 'tmux' not installed. Install: brew install tmux" >&2; exit 1; }
[[ -f .env ]]          || { echo "ERROR: .env missing on this machine. Copy it over: scp .env <you>@<host>:$(pwd)/.env" >&2; exit 1; }
grep -q '^LINEAR_API_KEY=' .env || { echo "ERROR: .env has no LINEAR_API_KEY — secrets incomplete." >&2; exit 1; }
[[ -f "$PROMPT_FILE" ]] || { echo "ERROR: prompt file '$PROMPT_FILE' not found." >&2; exit 1; }

SESSION="goodfood-${QUEUE}"
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "A session named '$SESSION' is already running. Attach with: tmux attach -t $SESSION" >&2
  exit 1
fi

# Permission flags.
if [[ "$MODE" == "yolo" ]]; then
  MODE_FLAGS=(--dangerously-skip-permissions)
  echo "⚠️  yolo mode: --dangerously-skip-permissions (no prompts). Only on a trusted machine + repo."
else
  MODE_FLAGS=(--permission-mode "$MODE")
fi

mkdir -p logs
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="logs/${SESSION}-${STAMP}.log"

# Launch Claude Code in a detached tmux session, seeded with the queue prompt, tee'd to a log.
# `script` gives a PTY so the interactive TUI behaves; falls back to plain pipe if unavailable.
PROMPT="$(cat "$PROMPT_FILE")"
tmux new-session -d -s "$SESSION" -c "$(pwd)" \
  "claude ${MODE_FLAGS[*]} \"\$(cat '$PROMPT_FILE')\" 2>&1 | tee '$LOG'"

cat <<EOF
✅ Launched queue '$QUEUE' on this machine.
   tmux session : $SESSION
   permission   : $MODE
   log          : $(pwd)/$LOG

Watch / steer : tmux attach -t $SESSION      (detach: Ctrl-b then d)
Tail log      : tail -f $(pwd)/$LOG
List queues   : tmux ls

You can close your laptop now — this keeps running on this always-on machine.
Retrieve anytime: git pull + open the queue's parent Linear issue (GOO-*).
Register it in docs/cloud-queues.md (Host = this machine's name).
EOF
