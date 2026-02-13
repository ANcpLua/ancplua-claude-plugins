#!/usr/bin/env bash
# session-state.sh — TTL session state + artifact cache + decision log
# The Senzu Bean infrastructure: persist expensive computations, log decisions,
# auto-expire stale sessions. Idempotent by design.
set -euo pipefail

GATES_DIR="${GATES_DIR:-.eight-gates}"
SESSION_FILE="${GATES_DIR}/session.json"
ARTIFACTS_DIR="${GATES_DIR}/artifacts"
DECISIONS_FILE="${GATES_DIR}/decisions.jsonl"

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g'; }

create() {
  local session_id="${1:?Usage: session-state.sh create <session-id> [ttl-seconds]}"
  local ttl="${2:-7200}"

  mkdir -p "$ARTIFACTS_DIR"
  touch "$DECISIONS_FILE"

  local created_at expires_epoch
  created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  expires_epoch="$(( $(date -u +%s) + ttl ))"

  if command -v jq &>/dev/null; then
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

  if command -v jq &>/dev/null; then
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

  if command -v jq &>/dev/null; then
    local new_expires
    new_expires="$(jq -r ".expires_epoch + ${extra_ttl}" "$SESSION_FILE")"
    local tmp
    tmp="$(jq ".expires_epoch = ${new_expires} | .ttl = .ttl + ${extra_ttl}" "$SESSION_FILE")"
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

  if command -v jq &>/dev/null; then
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

  mkdir -p "$ARTIFACTS_DIR"
  printf '%s' "$value" > "${ARTIFACTS_DIR}/${key}"
  echo "Artifact cached: ${key} ($(printf '%s' "$value" | wc -c | tr -d ' ') bytes)"
}

artifact_get() {
  local key="${1:?Usage: session-state.sh artifact get <key>}"
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
  # shellcheck disable=SC2012
  ls -1 "$ARTIFACTS_DIR" 2>/dev/null | while read -r f; do
    local size
    size="$(wc -c < "${ARTIFACTS_DIR}/${f}" | tr -d ' ')"
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

  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  decision="$(json_escape "$decision")"
  reason="$(json_escape "$reason")"

  printf '{"ts":"%s","decision":"%s","reason":"%s"}\n' \
    "$ts" "$decision" "$reason" >> "$DECISIONS_FILE"

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

  if command -v jq &>/dev/null; then
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
      *)    decision_log "$@" ;;
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
    echo "  decision <decision> <reason>        Log decision" >&2
    echo "  decision list                       List all decisions" >&2
    exit 1
    ;;
esac
