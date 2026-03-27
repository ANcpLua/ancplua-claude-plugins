#!/usr/bin/env bash
set -euo pipefail

STATE_ROOT="${FEATURE_DEV_STATE_DIR:-.feature-dev}"
DEFAULT_TTL_SECONDS="${FEATURE_DEV_STATE_TTL_SECONDS:-14400}"

usage() {
  cat <<'EOF'
Usage:
  runtime-state.sh path <feature-slug> <research|plan>
  runtime-state.sh clear <feature-slug>
  runtime-state.sh prune [ttl-seconds]
EOF
}

validate_slug() {
  local slug="${1:?missing feature slug}"
  if [[ ! "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    echo "Error: invalid feature slug '$slug'. Use lowercase kebab-case." >&2
    exit 1
  fi
}

validate_kind() {
  local kind="${1:?missing kind}"
  case "$kind" in
    research|plan) ;;
    *)
      echo "Error: invalid kind '$kind'. Use 'research' or 'plan'." >&2
      exit 1
      ;;
  esac
}

ttl_minutes() {
  local ttl="${1:?missing ttl seconds}"
  echo $(( (ttl + 59) / 60 ))
}

state_dir() {
  local slug="${1:?missing feature slug}"
  printf '%s/%s' "$STATE_ROOT" "$slug"
}

path_cmd() {
  local slug="${1:?missing feature slug}"
  local kind="${2:?missing kind}"

  validate_slug "$slug"
  validate_kind "$kind"
  prune_cmd "$DEFAULT_TTL_SECONDS" >/dev/null

  mkdir -p "$(state_dir "$slug")"
  printf '%s/%s.md\n' "$(state_dir "$slug")" "$kind"
}

clear_cmd() {
  local slug="${1:?missing feature slug}"

  validate_slug "$slug"
  rm -rf "$(state_dir "$slug")"
}

prune_cmd() {
  local ttl="${1:-$DEFAULT_TTL_SECONDS}"
  local max_age_minutes

  if [ ! -d "$STATE_ROOT" ]; then
    return
  fi

  max_age_minutes="$(ttl_minutes "$ttl")"
  find "$STATE_ROOT" -mindepth 1 -maxdepth 1 -type d -mmin "+${max_age_minutes}" -exec rm -rf {} +
}

case "${1:-}" in
  path)
    shift
    path_cmd "$@"
    ;;
  clear)
    shift
    clear_cmd "$@"
    ;;
  prune)
    shift
    prune_cmd "$@"
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
