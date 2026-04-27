#!/usr/bin/env bash
# break-manifest.sh — Append-only public-API break manifest for Smart-Hades --guillotine
# Storage: .smart/break-manifest.jsonl (one JSON object per line)
#
# Schema per entry:
#   ts                          ISO-8601 UTC timestamp
#   smart_id                    Hades session Smart ID
#   agent                       Eliminator that emitted the entry (smart-guillotine-elim)
#   removed_symbol_id           Roslyn fully-qualified ID of the broken symbol
#   replacement_symbol_id       Roslyn FQ ID of the replacement, OR null
#   consumer_call_sites_before  JSON array of file:line strings
#   consumer_call_sites_after   JSON array of file:line strings
#   removed_tests               JSON array of test file paths deleted in the same break
#   removal_justification       Human-readable sentence, OR null (required when replacement is null)
#   git_sha                     HEAD sha at the time of the break
#
# Invariant: NOT (replacement_symbol_id IS null AND removal_justification IS null).
# `validate` enforces it.
set -euo pipefail

SMART_DIR="${SMART_DIR:-.smart}"
MANIFEST_FILE="${SMART_DIR}/break-manifest.jsonl"

# shellcheck source=lib.sh
source "${BASH_SOURCE[0]%/*}/lib.sh"

# Convert a CSV string into a JSON array of escaped strings.
# Empty CSV becomes []. Single value becomes ["x"]. Comma-separated becomes ["a","b"].
csv_to_json_array() {
  local csv="${1:-}"
  if [ -z "$csv" ]; then
    printf '%s' '[]'
    return
  fi
  local out="[" first=true item
  local IFS=','
  for item in $csv; do
    # Trim whitespace
    item="${item#"${item%%[![:space:]]*}"}"
    item="${item%"${item##*[![:space:]]}"}"
    [ -z "$item" ] && continue
    if [ "$first" = true ]; then
      first=false
    else
      out+=","
    fi
    out+="\"$(json_escape "$item")\""
  done
  out+="]"
  printf '%s' "$out"
}

init() {
  mkdir -p "$SMART_DIR"
  touch "$MANIFEST_FILE"
  echo "Break manifest initialized at ${MANIFEST_FILE}"
}

append() {
  local smart_id="${1:?Usage: break-manifest.sh append <smart-id> <removed_symbol> <replacement|null> <callers_before_csv> <callers_after_csv> <removed_tests_csv> <justification|null> [agent] [git-sha]}"
  local removed="${2:?removed_symbol_id is required}"
  local replacement="${3:?replacement_symbol_id is required (use the literal string \"null\" if none)}"
  local callers_before="${4:-}"
  local callers_after="${5:-}"
  local removed_tests="${6:-}"
  local justification="${7:?removal_justification is required (use the literal string \"null\" if a replacement is set)}"
  local agent="${8:-unknown}"
  local git_sha="${9:-}"
  local ts

  if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: Manifest not initialized. Run 'break-manifest.sh init' first." >&2
    exit 1
  fi

  # Hard invariant: cannot be null on both axes
  if [ "$replacement" = "null" ] && [ "$justification" = "null" ]; then
    echo "Error: replacement_symbol_id AND removal_justification are both null." >&2
    echo "       A brutal break needs either a replacement or a stated reason." >&2
    exit 1
  fi

  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  local callers_before_json callers_after_json removed_tests_json
  callers_before_json="$(csv_to_json_array "$callers_before")"
  callers_after_json="$(csv_to_json_array "$callers_after")"
  removed_tests_json="$(csv_to_json_array "$removed_tests")"

  local replacement_field justification_field
  if [ "$replacement" = "null" ]; then
    replacement_field="null"
  else
    replacement_field="\"$(json_escape "$replacement")\""
  fi
  if [ "$justification" = "null" ]; then
    justification_field="null"
  else
    justification_field="\"$(json_escape "$justification")\""
  fi

  removed="$(json_escape "$removed")"
  agent="$(json_escape "$agent")"
  smart_id="$(json_escape "$smart_id")"
  git_sha="$(json_escape "$git_sha")"

  local line
  printf -v line '{"ts":"%s","smart_id":"%s","agent":"%s","removed_symbol_id":"%s","replacement_symbol_id":%s,"consumer_call_sites_before":%s,"consumer_call_sites_after":%s,"removed_tests":%s,"removal_justification":%s,"git_sha":"%s"}' \
    "$ts" "$smart_id" "$agent" "$removed" "$replacement_field" \
    "$callers_before_json" "$callers_after_json" "$removed_tests_json" \
    "$justification_field" "$git_sha"

  if has_flock; then
    (
      flock -x 200
      printf '%s\n' "$line" >> "$MANIFEST_FILE"
    ) 200>"${MANIFEST_FILE}.lock"
  else
    printf '%s\n' "$line" >> "$MANIFEST_FILE"
  fi
}

query() {
  local symbol="${1:?Usage: break-manifest.sh query <symbol_id>}"
  if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: Manifest not initialized." >&2
    exit 1
  fi
  # Match the input against the SAME escaping the manifest stores, otherwise
  # symbols with quotes / backslashes / control chars never match.
  local escaped
  escaped="$(json_escape "$symbol")"
  grep -F "\"removed_symbol_id\":\"${escaped}\"" "$MANIFEST_FILE" || echo "No entries for: ${symbol}"
}

count() {
  if [ ! -f "$MANIFEST_FILE" ]; then
    echo "0"
    return
  fi
  wc -l < "$MANIFEST_FILE" | tr -d ' '
}

# Verify every entry has either a replacement or a justification.
# Exits 0 when manifest is valid; 1 with a list of offending lines when invalid.
validate() {
  if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: Manifest not initialized." >&2
    exit 1
  fi

  local invalid=0 line
  # `|| [ -n "$line" ]` catches the final entry when the manifest is missing
  # a trailing newline (atomic appenders sometimes drop it on partial flush).
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    if [[ "$line" == *'"replacement_symbol_id":null'* ]] && \
       [[ "$line" == *'"removal_justification":null'* ]]; then
      printf 'INVALID: %s\n' "$line" >&2
      invalid=$((invalid + 1))
    fi
  done < "$MANIFEST_FILE"

  if [ "$invalid" -gt 0 ]; then
    echo "Found ${invalid} invalid entr$( [ "$invalid" -eq 1 ] && echo "y" || echo "ies" ) (both replacement and justification are null)." >&2
    exit 1
  fi

  printf 'Manifest valid: %s entries; every entry has a replacement or a justification.\n' "$(count)"
}

case "${1:-}" in
  init)     init ;;
  append)   shift; append "$@" ;;
  query)    shift; query "$@" ;;
  count)    count ;;
  validate) validate ;;
  *)
    cat >&2 <<'USAGE'
Usage: break-manifest.sh {init|append|query|count|validate}
  init                                                                  Initialize manifest
  append <smart-id> <removed_symbol_id> <replacement_symbol_id|null>
         <callers_before_csv> <callers_after_csv> <removed_tests_csv>
         <removal_justification|null> [agent] [git-sha]                 Append a break entry
  query <symbol_id>                                                     Find entries for a symbol
  count                                                                 Count total entries
  validate                                                              Verify replacement-or-justification invariant
USAGE
    exit 1
    ;;
esac
