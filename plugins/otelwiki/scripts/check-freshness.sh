#!/usr/bin/env bash
# =============================================================================
# CHECK FRESHNESS - Reports OTel docs version at session start
# =============================================================================
# Trigger: SessionStart
# Purpose: Inform user about current OTel docs version and offer sync
# =============================================================================

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

VERSION_FILE="${PLUGIN_ROOT}/docs/VERSION.md"

if [[ -f "$VERSION_FILE" ]]; then
    CURRENT_VERSION=$(grep -m1 "semconv" "$VERSION_FILE" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
    echo "OTEL_DOCS_PROMPT|Current: semconv ${CURRENT_VERSION}|Offer user: /otelwiki:sync to refresh"
else
    echo "OTEL_DOCS_PROMPT|Not initialized|Offer user: /otelwiki:sync to set up"
fi

exit 0
