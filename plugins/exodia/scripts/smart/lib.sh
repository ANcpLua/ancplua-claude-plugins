#!/usr/bin/env bash
# lib.sh — Shared utilities for Smart Infrastructure scripts
# Source this file: source "${BASH_SOURCE[0]%/*}/lib.sh"

# Escape a string for safe embedding in JSON values.
# Returns UNQUOTED escaped content (for use inside printf '"%s"' templates).
# Handles: backslashes, double quotes, tabs, newlines.
json_escape() {
  if command -v jq &>/dev/null; then
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
