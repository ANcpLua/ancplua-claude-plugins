#!/usr/bin/env bash
# checkpoint.sh — Gate checkpoint management for Eight Gates
# Storage: .eight-gates/checkpoints.jsonl (append-only, one JSON per line)
# Idempotent: verify() checks if gate already done before re-running
set -euo pipefail

GATES_DIR="${GATES_DIR:-.eight-gates}"
CHECKPOINT_FILE="${GATES_DIR}/checkpoints.jsonl"
SESSION_ID_FILE="${GATES_DIR}/.session-id"

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'; }

init() {
  local session_id="${1:?Usage: checkpoint.sh init <session-id>}"
  mkdir -p "${GATES_DIR}/artifacts"
  touch "$CHECKPOINT_FILE"
  printf '%s' "$session_id" > "$SESSION_ID_FILE"
  echo "Checkpoint system initialized for session: ${session_id}"
}

save() {
  local gate="${1:?Usage: checkpoint.sh save <gate-number> <status> [key=value...]}"
  local status="${2:?}"
  shift 2

  if [ ! -f "$CHECKPOINT_FILE" ]; then
    echo "Error: Not initialized. Run 'checkpoint.sh init <session-id>' first." >&2
    exit 1
  fi

  local session_id ts metadata=""
  session_id="$(cat "$SESSION_ID_FILE")"
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # Build metadata from remaining key=value args
  for kv in "$@"; do
    local key="${kv%%=*}"
    local val="${kv#*=}"
    key="$(json_escape "$key")"
    val="$(json_escape "$val")"
    metadata="${metadata}\"${key}\":\"${val}\","
  done
  # Remove trailing comma
  metadata="${metadata%,}"

  local entry
  entry="$(printf '{"ts":"%s","session_id":"%s","gate":%d,"status":"%s","meta":{%s}}' \
    "$ts" "$session_id" "$gate" "$status" "$metadata")"

  echo "$entry" >> "$CHECKPOINT_FILE"
  echo "Gate ${gate}: ${status}"
}

load() {
  if [ ! -f "$CHECKPOINT_FILE" ]; then
    echo "Error: No checkpoints found." >&2
    exit 1
  fi
  # Return last checkpoint
  tail -1 "$CHECKPOINT_FILE"
}

verify() {
  local gate="${1:?Usage: checkpoint.sh verify <gate-number>}"
  if [ ! -f "$CHECKPOINT_FILE" ]; then
    echo "NOT_DONE"
    return
  fi
  # Check if gate has a completion entry
  if grep -q "\"gate\":${gate}" "$CHECKPOINT_FILE" 2>/dev/null; then
    echo "DONE"
  else
    echo "NOT_DONE"
  fi
}

list() {
  if [ ! -f "$CHECKPOINT_FILE" ]; then
    echo "No checkpoints."
    return
  fi

  local count
  count="$(wc -l < "$CHECKPOINT_FILE" | tr -d ' ')"
  echo "Checkpoints: ${count}"
  echo "---"

  # Pretty-print if jq available, raw otherwise
  if command -v jq &>/dev/null; then
    jq -r '"Gate \(.gate): \(.status) [\(.ts)]"' "$CHECKPOINT_FILE"
  else
    while IFS= read -r line; do
      echo "$line"
    done < "$CHECKPOINT_FILE"
  fi
}

case "${1:-}" in
  init)   shift; init "$@" ;;
  save)   shift; save "$@" ;;
  load)   load ;;
  verify) shift; verify "$@" ;;
  list)   list ;;
  *)
    echo "Usage: checkpoint.sh {init|save|load|verify|list}" >&2
    echo "  init <session-id>                     Initialize checkpoint system" >&2
    echo "  save <gate> <status> [key=value...]   Save gate checkpoint" >&2
    echo "  load                                  Load last checkpoint" >&2
    echo "  verify <gate>                         Check if gate already done" >&2
    echo "  list                                  List all checkpoints" >&2
    exit 1
    ;;
esac
