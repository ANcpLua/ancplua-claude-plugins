#!/usr/bin/env bash
# ledger.sh — Append-only deletion ledger for Smart-Hades
# Storage: .smart/delete-ledger.jsonl (one JSON object per line)
set -euo pipefail

SMART_DIR="${SMART_DIR:-.smart}"
LEDGER_FILE="${SMART_DIR}/delete-ledger.jsonl"

# shellcheck source=lib.sh
source "${BASH_SOURCE[0]%/*}/lib.sh"

init() {
  mkdir -p "$SMART_DIR"
  touch "$LEDGER_FILE"
  echo "Ledger initialized at ${LEDGER_FILE}"
}

append() {
  local smart_id="${1:?Usage: ledger.sh append <smart-id> <action> <path> <reason> [agent] [git-sha]}"
  local action="${2:?}"
  local path="${3:?}"
  local reason="${4:?}"
  local agent="${5:-unknown}"
  local git_sha="${6:-}"
  local ts

  if [ ! -f "$LEDGER_FILE" ]; then
    echo "Error: Ledger not initialized. Run 'ledger.sh init' first." >&2
    exit 1
  fi

  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # Escape user-supplied values to prevent JSON corruption
  path="$(json_escape "$path")"
  reason="$(json_escape "$reason")"
  agent="$(json_escape "$agent")"

  # Atomic append (flock if available, direct write otherwise — matches permit.sh pattern)
  if command -v flock &>/dev/null; then
    (
      flock -x 200
      printf '{"ts":"%s","smart_id":"%s","action":"%s","path":"%s","reason":"%s","agent":"%s","git_sha":"%s"}\n' \
        "$ts" "$smart_id" "$action" "$path" "$reason" "$agent" "$git_sha" >> "$LEDGER_FILE"
    ) 200>"${LEDGER_FILE}.lock"
  else
    printf '{"ts":"%s","smart_id":"%s","action":"%s","path":"%s","reason":"%s","agent":"%s","git_sha":"%s"}\n' \
      "$ts" "$smart_id" "$action" "$path" "$reason" "$agent" "$git_sha" >> "$LEDGER_FILE"
  fi
}

query() {
  local path="${1:?Usage: ledger.sh query <path>}"
  if [ ! -f "$LEDGER_FILE" ]; then
    echo "Error: Ledger not initialized." >&2
    exit 1
  fi
  grep -F "\"path\":\"${path}\"" "$LEDGER_FILE" || echo "No entries for: ${path}"
}

count() {
  if [ ! -f "$LEDGER_FILE" ]; then
    echo "0"
    return
  fi
  wc -l < "$LEDGER_FILE" | tr -d ' '
}

case "${1:-}" in
  init)   init ;;
  append) shift; append "$@" ;;
  query)  shift; query "$@" ;;
  count)  count ;;
  *)
    echo "Usage: ledger.sh {init|append|query|count}" >&2
    echo "  init                                          Initialize ledger" >&2
    echo "  append <smart-id> <action> <path> <reason> [agent] [git-sha]" >&2
    echo "  query <path>                                  Find entries for path" >&2
    echo "  count                                         Count total entries" >&2
    exit 1
    ;;
esac
