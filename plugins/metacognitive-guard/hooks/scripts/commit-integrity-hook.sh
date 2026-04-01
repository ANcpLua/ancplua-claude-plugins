#!/usr/bin/env bash
# =============================================================================
# COMMIT INTEGRITY HOOK (PreToolUse wrapper)
# =============================================================================
# Filtered by hooks.json `if: "Bash(git commit*)"` — harness guarantees this
# only fires for git commit commands. Delegates directly to integrity-check.sh.
# =============================================================================

set -euo pipefail

cat > /dev/null  # consume stdin (not needed by integrity-check.sh)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "${SCRIPT_DIR}/integrity-check.sh"
