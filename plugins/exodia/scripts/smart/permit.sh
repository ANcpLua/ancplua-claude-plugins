#!/usr/bin/env bash
# permit.sh — Short-lived deletion permits for Smart-Hades
# Storage: .smart/delete-permit.json
set -euo pipefail

SMART_DIR="${SMART_DIR:-.smart}"
PERMIT_FILE="${SMART_DIR}/delete-permit.json"

# shellcheck source=lib.sh
source "${BASH_SOURCE[0]%/*}/lib.sh"

create() {
  local smart_id="${1:?Usage: permit.sh create <smart-id> <paths...> [--ttl=300]}"
  shift
  local ttl=300
  local paths=()

  for arg in "$@"; do
    case "$arg" in
      --ttl=*) ttl="${arg#--ttl=}" ;;
      *) paths+=("$arg") ;;
    esac
  done

  if [ ${#paths[@]} -eq 0 ]; then
    echo "Error: At least one path required." >&2
    exit 1
  fi

  mkdir -p "$SMART_DIR"

  local created_at expires_at
  created_at="$(date -u +%s)"
  expires_at=$(( created_at + ttl ))
  local created_iso expires_iso
  created_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  expires_iso="$(date -u -r "$expires_at" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "@$expires_at" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "unknown")"

  # Build paths JSON array with escaped values
  local paths_json="["
  local first=true
  for p in "${paths[@]}"; do
    if [ "$first" = true ]; then
      first=false
    else
      paths_json+=","
    fi
    paths_json+="\"$(json_escape "$p")\""
  done
  paths_json+="]"

  # Atomic write (flock if available, direct write otherwise)
  if command -v flock &>/dev/null; then
    (
      flock -x 200
      printf '{"smart_id":"%s","created_at":"%s","expires_at":"%s","ttl":%d,"expires_epoch":%d,"paths":%s,"status":"active"}\n' \
        "$smart_id" "$created_iso" "$expires_iso" "$ttl" "$expires_at" "$paths_json" > "$PERMIT_FILE"
    ) 200>"${PERMIT_FILE}.lock"
  else
    printf '{"smart_id":"%s","created_at":"%s","expires_at":"%s","ttl":%d,"expires_epoch":%d,"paths":%s,"status":"active"}\n' \
      "$smart_id" "$created_iso" "$expires_iso" "$ttl" "$expires_at" "$paths_json" > "$PERMIT_FILE"
  fi

  echo "Permit created: ${smart_id} (TTL: ${ttl}s, paths: ${#paths[@]})"
}

validate() {
  local path="${1:?Usage: permit.sh validate <path>}"

  if [ ! -f "$PERMIT_FILE" ]; then
    echo "DENIED: No active permit." >&2
    exit 1
  fi

  # Check expiration
  local now expires_epoch
  now="$(date -u +%s)"
  expires_epoch="$(grep -o '"expires_epoch":[0-9]*' "$PERMIT_FILE" | grep -o '[0-9]*')"

  if [ "$now" -gt "$expires_epoch" ]; then
    echo "DENIED: Permit expired." >&2
    exit 1
  fi

  # Check status
  if ! grep -q '"status":"active"' "$PERMIT_FILE"; then
    echo "DENIED: Permit revoked." >&2
    exit 1
  fi

  # Check path is covered
  if grep -qF "\"${path}\"" "$PERMIT_FILE"; then
    echo "PERMITTED: ${path}"
    exit 0
  fi

  # Check if a parent directory is covered (permit for "src/" covers "src/foo.cs")
  local permit_paths
  permit_paths="$(grep -o '"paths":\[[^]]*\]' "$PERMIT_FILE")"
  # Directory-boundary-aware prefix match
  local found=false
  while IFS= read -r pp; do
    pp="${pp//\"/}"
    [ -z "$pp" ] && continue
    # Exact match, or pp ends with / (directory scope), or path starts with pp/
    if [[ "$path" == "$pp" ]] || [[ "$pp" == */ && "$path" == "$pp"* ]] || [[ "$path" == "$pp/"* ]]; then
      found=true
      break
    fi
  done < <(echo "$permit_paths" | tr ',' '\n' | sed 's/.*\[//;s/\].*//;s/"//g')

  if [ "$found" = true ]; then
    echo "PERMITTED: ${path} (via parent scope)"
    exit 0
  fi

  echo "DENIED: ${path} not in permit scope." >&2
  exit 1
}

revoke() {
  if [ ! -f "$PERMIT_FILE" ]; then
    echo "No active permit to revoke."
    return
  fi
  # Atomic revoke (flock if available)
  if command -v flock &>/dev/null; then
    (
      flock -x 200
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/"status":"active"/"status":"revoked"/' "$PERMIT_FILE"
      else
        sed -i 's/"status":"active"/"status":"revoked"/' "$PERMIT_FILE"
      fi
    ) 200>"${PERMIT_FILE}.lock"
  else
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's/"status":"active"/"status":"revoked"/' "$PERMIT_FILE"
    else
      sed -i 's/"status":"active"/"status":"revoked"/' "$PERMIT_FILE"
    fi
  fi
  echo "Permit revoked."
}

show() {
  if [ ! -f "$PERMIT_FILE" ]; then
    echo "No permit found."
    return
  fi
  cat "$PERMIT_FILE"
}

case "${1:-}" in
  create)   shift; create "$@" ;;
  validate) shift; validate "$@" ;;
  revoke)   revoke ;;
  show)     show ;;
  *)
    echo "Usage: permit.sh {create|validate|revoke|show}" >&2
    echo "  create <smart-id> <paths...> [--ttl=300]  Create deletion permit" >&2
    echo "  validate <path>                            Check if path is permitted" >&2
    echo "  revoke                                     Revoke active permit" >&2
    echo "  show                                       Show current permit" >&2
    exit 1
    ;;
esac
