#!/usr/bin/env bash
# =============================================================================
# COMMIT INTEGRITY HOOK (PreToolUse wrapper)
# =============================================================================
# Fires on all Bash tool calls, but only runs the integrity check when the
# command is a git commit. For all other commands, exits 0 immediately.
# =============================================================================

set -euo pipefail

INPUT=$(cat)

# Extract the bash command from hook input
COMMAND=""
if command -v jq &>/dev/null; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
else
  # Fallback: regex extraction
  COMMAND=$(echo "$INPUT" | sed -n 's/.*"command"\s*:\s*"\([^"]*\)".*/\1/p' 2>/dev/null || true)
fi

# Only run for git commit commands
if ! echo "$COMMAND" | grep -qE '\bgit\b.*\bcommit\b'; then
  exit 0
fi

# Delegate to the integrity check script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bash "${SCRIPT_DIR}/integrity-check.sh"
