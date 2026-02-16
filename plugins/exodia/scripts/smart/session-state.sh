#!/usr/bin/env bash
# session-state.sh — TTL session state + artifact cache + decision log
# The Senzu Bean infrastructure: persist expensive computations, log decisions,
# auto-expire stale sessions. Idempotent by design.
set -euo pipefail

GATES_DIR="${GATES_DIR:-.eight-gates}"
SESSION_FILE="${GATES_DIR}/session.json"
ARTIFACTS_DIR="${GATES_DIR}/artifacts"
DECISIONS_FILE="${GATES_DIR}/decisions.jsonl"

# shellcheck source=lib.sh
source "${BASH_SOURCE[0]%/*}/lib.sh"

# Validate artifact key — reject path traversal and unsafe characters
validate_artifact_key() {
  local key="$1"
  if [[ "$key" == *"/"* ]] || [[ "$key" == *".."* ]] || [[ "$key" == "" ]]; then
    echo "Error: Invalid artifact key '${key}'. Keys must not contain '/' or '..'." >&2
    return 1
  fi
}

create() {
  local session_id="${1:?Usage: session-state.sh create <session-id> [ttl-seconds]}"
  local ttl="${2:-7200}"

  mkdir -p "$ARTIFACTS_DIR"
  touch "$DECISIONS_FILE"

  local created_at expires_epoch
  created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  expires_epoch="$(( $(date -u +%s) + ttl ))"

  if has_jq; then
    jq -n \
      --arg sid "$session_id" \
      --arg cat "$created_at" \
      --argjson ttl "$ttl" \
      --argjson exp "$expires_epoch" \
      '{session_id: $sid, created_at: $cat, ttl: $ttl, expires_epoch: $exp, status: "active", gates_opened: 0, agents_spawned: 0}' \
      > "$SESSION_FILE"
  else
    printf '{"session_id":"%s","created_at":"%s","ttl":%d,"expires_epoch":%d,"status":"active","gates_opened":0,"agents_spawned":0}\n' \
      "$session_id" "$created_at" "$ttl" "$expires_epoch" > "$SESSION_FILE"
  fi

  echo "Session created: ${session_id} (TTL: ${ttl}s)"
}

validate() {
  if [ ! -f "$SESSION_FILE" ]; then
    echo "NO_SESSION"
    return 1
  fi

  local now expires_epoch status
  now="$(date -u +%s)"

  if has_jq; then
    expires_epoch="$(jq -r '.expires_epoch' "$SESSION_FILE")"
    status="$(jq -r '.status' "$SESSION_FILE")"
  else
    expires_epoch="$(grep -o '"expires_epoch":[0-9]*' "$SESSION_FILE" | cut -d: -f2)"
    status="$(grep -o '"status":"[^"]*"' "$SESSION_FILE" | cut -d'"' -f4)"
  fi

  if [ "$status" = "expired" ]; then
    echo "EXPIRED"
    return 1
  fi

  if [ "$now" -gt "$expires_epoch" ]; then
    echo "TTL_EXCEEDED"
    return 1
  fi

  local remaining=$(( expires_epoch - now ))
  echo "VALID (${remaining}s remaining)"
}

extend() {
  local extra_ttl="${1:?Usage: session-state.sh extend <additional-seconds>}"

  if [ ! -f "$SESSION_FILE" ]; then
    echo "Error: No session found." >&2
    exit 1
  fi

  if has_jq; then
    local tmp
    tmp="$(jq --argjson extra "$extra_ttl" \
      '(.expires_epoch += $extra) | (.ttl += $extra)' "$SESSION_FILE")"
    printf '%s\n' "$tmp" > "$SESSION_FILE"
  else
    echo "Warning: jq not available, cannot extend session." >&2
    return 1
  fi

  echo "Session extended by ${extra_ttl}s"
}

expire() {
  if [ ! -f "$SESSION_FILE" ]; then
    echo "No session to expire."
    return
  fi

  if has_jq; then
    local tmp
    tmp="$(jq '.status = "expired"' "$SESSION_FILE")"
    printf '%s\n' "$tmp" > "$SESSION_FILE"
  else
    sed -i.bak 's/"status":"active"/"status":"expired"/' "$SESSION_FILE"
    rm -f "${SESSION_FILE}.bak"
  fi

  echo "Session expired."
}

artifact_add() {
  local key="${1:?Usage: session-state.sh artifact add <key> <value>}"
  local value="${2:?}"

  validate_artifact_key "$key" || exit 1

  mkdir -p "$ARTIFACTS_DIR"
  printf '%s' "$value" > "${ARTIFACTS_DIR}/${key}"
  echo "Artifact cached: ${key} ($(printf '%s' "$value" | wc -c | tr -d ' ') bytes)"
}

artifact_get() {
  local key="${1:?Usage: session-state.sh artifact get <key>}"

  validate_artifact_key "$key" || exit 1

  local path="${ARTIFACTS_DIR}/${key}"

  if [ ! -f "$path" ]; then
    echo "MISS"
    return 1
  fi

  cat "$path"
}

artifact_list() {
  if [ ! -d "$ARTIFACTS_DIR" ]; then
    echo "No artifacts."
    return
  fi

  find "$ARTIFACTS_DIR" -maxdepth 1 -type f -print0 2>/dev/null | \
    while IFS= read -r -d '' path; do
      local f size
      f="${path##*/}"
      size="$(wc -c < "$path" | tr -d ' ')"
      echo "  ${f} (${size} bytes)"
    done
}

decision_log() {
  local decision="${1:?Usage: session-state.sh decision <decision> <reason>}"
  local reason="${2:?}"

  if [ ! -f "$DECISIONS_FILE" ]; then
    mkdir -p "$GATES_DIR"
    touch "$DECISIONS_FILE"
  fi

  local ts escaped_decision escaped_reason
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  if has_jq; then
    jq -n -c \
      --arg ts "$ts" \
      --arg d "$decision" \
      --arg r "$reason" \
      '{ts: $ts, decision: $d, reason: $r}' >> "$DECISIONS_FILE"
  else
    escaped_decision="$(printf '%s' "$decision" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' ')"
    escaped_reason="$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' ')"
    printf '{"ts":"%s","decision":"%s","reason":"%s"}\n' \
      "$ts" "$escaped_decision" "$escaped_reason" >> "$DECISIONS_FILE"
  fi

  echo "Decision logged: ${decision}"
}

decision_list() {
  if [ ! -f "$DECISIONS_FILE" ]; then
    echo "No decisions logged."
    return
  fi

  local count
  count="$(wc -l < "$DECISIONS_FILE" | tr -d ' ')"
  echo "Decisions: ${count}"
  echo "---"

  if has_jq; then
    jq -r '"[\(.ts)] \(.decision): \(.reason)"' "$DECISIONS_FILE"
  else
    cat "$DECISIONS_FILE"
  fi
}

case "${1:-}" in
  create)   shift; create "$@" ;;
  validate) validate ;;
  extend)   shift; extend "$@" ;;
  expire)   expire ;;
  artifact)
    shift
    case "${1:-}" in
      add)  shift; artifact_add "$@" ;;
      get)  shift; artifact_get "$@" ;;
      list) artifact_list ;;
      *)    echo "Usage: session-state.sh artifact {add|get|list}" >&2; exit 1 ;;
    esac
    ;;
  decision)
    shift
    case "${1:-}" in
      list) decision_list ;;
      log)  shift; decision_log "$@" ;;
      *)
        if [ $# -ge 2 ]; then
          decision_log "$@"
        else
          echo "Usage: session-state.sh decision {log <decision> <reason>|list}" >&2
          exit 1
        fi
        ;;
    esac
    ;;
  *)
    echo "Usage: session-state.sh {create|validate|extend|expire|artifact|decision}" >&2
    echo "  create <session-id> [ttl]           Create session with TTL" >&2
    echo "  validate                            Check if session is valid" >&2
    echo "  extend <seconds>                    Extend session TTL" >&2
    echo "  expire                              Mark session expired" >&2
    echo "  artifact add <key> <value>          Cache artifact" >&2
    echo "  artifact get <key>                  Retrieve cached artifact" >&2
    echo "  artifact list                       List all artifacts" >&2
    echo "  decision log <decision> <reason>    Log decision" >&2
    echo "  decision list                       List all decisions" >&2
    exit 1
    ;;
esac
