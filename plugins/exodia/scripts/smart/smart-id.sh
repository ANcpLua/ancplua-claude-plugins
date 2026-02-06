#!/usr/bin/env bash
# smart-id.sh — Generate ULID-like Smart IDs for Hades sessions
# Format: SMART-YYYY-MM-DD-<13-digit-timestamp><20-char-random>
set -euo pipefail

generate() {
  local date_part timestamp random_part
  date_part="$(date -u +%Y-%m-%d)"
  timestamp="$(date -u +%s000)"
  # Pad timestamp to 13 digits
  timestamp="$(printf '%013d' "$timestamp")"
  # Generate 20 random alphanumeric characters
  random_part="$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 20 || true)"
  echo "SMART-${date_part}-${timestamp}${random_part}"
}

case "${1:-generate}" in
  generate) generate ;;
  *)
    echo "Usage: smart-id.sh [generate]" >&2
    exit 1
    ;;
esac
