# Safe .env loader — handles values containing &, <, spaces, etc.
# Usage: source scripts/env.sh   (from repo root)
set -a
while IFS= read -r __line; do
  case "$__line" in ''|\#*) continue;; esac
  __key=${__line%%=*}
  __val=${__line#*=}
  export "$__key=$__val"
done < "${GOODFOOD_ENV_FILE:-.env}"
set +a
unset __line __key __val