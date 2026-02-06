#!/usr/bin/env bash
# smart-id.sh — Generate timestamped unique IDs for Hades sessions
# Format: SMART-YYYY-MM-DD-<10-digit-epoch><20-char-random>
set -euo pipefail

generate() {
  local date_part epoch random_part
  date_part="$(date -u +%Y-%m-%d)"
  epoch="$(date -u +%s)"
  # Generate 20 random alphanumeric characters (read fixed bytes, encode, trim)
  random_part="$(head -c 15 /dev/urandom | base64 | LC_ALL=C tr -dc 'A-Za-z0-9' | head -c 20)"
  echo "SMART-${date_part}-${epoch}${random_part}"
}

case "${1:-generate}" in
  generate) generate ;;
  *)
    echo "Usage: smart-id.sh [generate]" >&2
    exit 1
    ;;
esac
