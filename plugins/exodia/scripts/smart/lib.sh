#!/usr/bin/env bash
# lib.sh — Shared utilities for Smart Infrastructure scripts
# Source this file: source "${BASH_SOURCE[0]%/*}/lib.sh"

# Check if jq is available. Cache result for repeated calls.
has_jq() {
  command -v jq &>/dev/null
}

# Check if flock is available (Linux yes, macOS no by default).
has_flock() {
  command -v flock &>/dev/null
}

# Atomic write to a file with flock if available, direct write otherwise.
# Usage: atomic_write <file> <content> [--append]
#   --append: append instead of overwrite
atomic_write() {
  local file="$1" content="$2" mode="${3:-}"
  if has_flock; then
    (
      flock -x 200
      if [ "$mode" = "--append" ]; then
        printf '%s\n' "$content" >> "$file"
      else
        printf '%s\n' "$content" > "$file"
      fi
    ) 200>"${file}.lock"
  else
    if [ "$mode" = "--append" ]; then
      printf '%s\n' "$content" >> "$file"
    else
      printf '%s\n' "$content" > "$file"
    fi
  fi
}

# Escape a string for safe embedding in JSON values.
# Returns UNQUOTED escaped content (for use inside printf '"%s"' templates).
# Handles: backslashes, double quotes, tabs, newlines.
json_escape() {
  if has_jq; then
    # jq -Rs produces a properly quoted JSON string: "he\"llo\nworld"
    # Strip surrounding quotes for embedding in printf templates
    local quoted
    quoted="$(printf '%s' "$1" | jq -Rs '.')"
    quoted="${quoted#\"}"
    quoted="${quoted%\"}"
    printf '%s' "$quoted"
    return
  fi
  # Fallback: manual escaping + newlines collapsed to spaces
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | tr '\n' ' '
}
