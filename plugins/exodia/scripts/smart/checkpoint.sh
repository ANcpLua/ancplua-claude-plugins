#!/usr/bin/env bash
# checkpoint.sh — Gate checkpoint management for Eight Gates
# Storage: .eight-gates/checkpoints.jsonl (append-only, one JSON per line)
# Idempotent: verify() checks if gate already done before re-running
set -euo pipefail

GATES_DIR="${GATES_DIR:-.eight-gates}"
CHECKPOINT_FILE="${GATES_DIR}/checkpoints.jsonl"
SESSION_ID_FILE="${GATES_DIR}/.session-id"

# shellcheck source=lib.sh
source "${BASH_SOURCE[0]%/*}/lib.sh"

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

  if [ ! -s "$SESSION_ID_FILE" ]; then
    echo "Error: Session not initialized. No session ID found." >&2
    exit 1
  fi

  local session_id ts metadata=""
  session_id="$(cat "$SESSION_ID_FILE")"
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # Build metadata from remaining key=value args
  for kv in "$@"; do
    local key="${kv%%=*}"
    local val="${kv#*=}"
    if has_jq; then
      local escaped_key escaped_val
      escaped_key="$(printf '%s' "$key" | jq -Rs '.')"
      escaped_val="$(printf '%s' "$val" | jq -Rs '.')"
      metadata="${metadata}${escaped_key}:${escaped_val},"
    else
      key="$(printf '%s' "$key" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g')"
      val="$(printf '%s' "$val" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g')"
      metadata="${metadata}\"${key}\":\"${val}\","
    fi
  done
  # Remove trailing comma
  metadata="${metadata%,}"

  local entry
  if has_jq; then
    entry="$(jq -n -c \
      --arg ts "$ts" \
      --arg sid "$session_id" \
      --argjson gate "$gate" \
      --arg status "$status" \
      "{ts: \$ts, session_id: \$sid, gate: \$gate, status: \$status, meta: {${metadata}}}")"
  else
    entry="$(printf '{"ts":"%s","session_id":"%s","gate":%d,"status":"%s","meta":{%s}}' \
      "$ts" "$session_id" "$gate" "$status" "$metadata")"
  fi

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

  local session_id=""
  if [ -s "$SESSION_ID_FILE" ]; then
    session_id="$(cat "$SESSION_ID_FILE")"
  fi

  # Use jq for exact matching when available
  if has_jq; then
    if [ -n "$session_id" ]; then
      if jq -e --argjson g "$gate" --arg sid "$session_id" \
        'select(.gate == $g and .session_id == $sid)' "$CHECKPOINT_FILE" >/dev/null 2>&1; then
        echo "DONE"
      else
        echo "NOT_DONE"
      fi
    else
      if jq -e --argjson g "$gate" 'select(.gate == $g)' "$CHECKPOINT_FILE" >/dev/null 2>&1; then
        echo "DONE"
      else
        echo "NOT_DONE"
      fi
    fi
  else
    # Fallback: match exact gate field with word boundaries
    if grep -qE "\"gate\":${gate}[,}]" "$CHECKPOINT_FILE" 2>/dev/null; then
      echo "DONE"
    else
      echo "NOT_DONE"
    fi
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
  if has_jq; then
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
