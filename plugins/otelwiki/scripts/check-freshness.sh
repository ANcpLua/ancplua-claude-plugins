#!/bin/bash
# Check if OTel docs are stale and warn the user

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"
VERSION_FILE="${PLUGIN_ROOT}/docs/VERSION.md"

# Check if VERSION.md exists
if [ ! -f "$VERSION_FILE" ]; then
  echo "OTel docs not initialized. Run /otelwiki:sync to set up."
  exit 0
fi

# Check if older than 7 days
if [ "$(uname)" = "Darwin" ]; then
  # macOS
  FILE_AGE=$(( ($(date +%s) - $(stat -f %m "$VERSION_FILE")) / 86400 ))
else
  # Linux
  FILE_AGE=$(( ($(date +%s) - $(stat -c %Y "$VERSION_FILE")) / 86400 ))
fi

if [ "$FILE_AGE" -gt 7 ]; then
  echo "OTel docs are stale (${FILE_AGE} days old). Run /otelwiki:sync to update."
fi
