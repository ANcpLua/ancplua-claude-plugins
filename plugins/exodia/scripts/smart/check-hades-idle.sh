#!/usr/bin/env bash
# =============================================================================
# CHECK-HADES-IDLE — TeammateIdle quality gate for Hades eliminators
# =============================================================================
# Fires when a Hades teammate is about to go idle.
# Ensures eliminators (smart-elim-*) have logged ledger entries before idling.
# Exit 0 = allow idle, exit 2 = keep working (stderr sent as feedback).
# =============================================================================

set -euo pipefail

INPUT=$(cat)

# Extract teammate name — jq with sed fallback (matches repo convention)
TEAMMATE=""
if command -v jq &>/dev/null; then
    TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // empty' 2>/dev/null)
else
    TEAMMATE=$(echo "$INPUT" | sed -n 's/.*"teammate_name"\s*:\s*"\([^"]*\)".*/\1/p' 2>/dev/null || true)
fi

# Only gate eliminators — auditors and verifiers idle freely
if ! echo "$TEAMMATE" | grep -q "smart-elim"; then
    exit 0
fi

LEDGER_SCRIPT="${CLAUDE_PLUGIN_ROOT}/scripts/smart/ledger.sh"

if [ ! -x "$LEDGER_SCRIPT" ]; then
    # Ledger script missing — don't block teammate
    exit 0
fi

COUNT=$("$LEDGER_SCRIPT" count 2>/dev/null | grep -o '[0-9]*' | head -1)

if [ "${COUNT:-0}" = "0" ]; then
    echo "No ledger entries found. Log your deletions before going idle." >&2
    exit 2
fi

exit 0
