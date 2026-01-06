#!/bin/bash
# Prompt user to sync OTel docs at session start
# Simple: always offer, override if yes (even if newest - same files, no harm)

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"
VERSION_FILE="${PLUGIN_ROOT}/docs/VERSION.md"

if [ -f "$VERSION_FILE" ]; then
  CURRENT_VERSION=$(grep -m1 "semconv" "$VERSION_FILE" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
  echo "OTEL_DOCS_PROMPT|Current: semconv ${CURRENT_VERSION}|Offer user: /otelwiki:sync to refresh"
else
  echo "OTEL_DOCS_PROMPT|Not initialized|Offer user: /otelwiki:sync to set up"
fi
