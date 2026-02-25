#!/usr/bin/env bash
# =============================================================================
# STRUGGLE INJECT - Delivers struggle detection to Claude via UserPromptSubmit
# =============================================================================
# Trigger: UserPromptSubmit (before Claude processes the next prompt)
# Purpose: Read blackboard state from async struggle-detector and inject
#          suggestion as additionalContext so Claude actually sees it.
#
# The struggle-detector.sh (Stop, async) writes scoring data to:
#   .blackboard/.struggle-count   — consecutive struggling responses
#   .blackboard/.struggle-signals — detailed signal log
#
# This hook reads those files and injects context when threshold is met.
# After injection, resets the counter to prevent repeated suggestions.
# =============================================================================

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

BLACKBOARD="$PLUGIN_ROOT/.blackboard"
STRUGGLE_COUNT_FILE="$BLACKBOARD/.struggle-count"

# Check consecutive struggle count
CONSECUTIVE=$(cat "$STRUGGLE_COUNT_FILE" 2>/dev/null || echo "0")
[[ "$CONSECUTIVE" -lt 2 ]] && exit 0

# Read recent signals for context
SIGNALS_FILE="$BLACKBOARD/.struggle-signals"
RECENT_SIGNALS=""
if [[ -f "$SIGNALS_FILE" ]]; then
    RECENT_SIGNALS=$(tail -20 "$SIGNALS_FILE" | grep '  - ' | sed 's/  - //' | tr '\n' ', ' | sed 's/, $//')
fi

# Inject as additionalContext — Claude sees this field on UserPromptSubmit
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "STRUGGLE DETECTOR ($CONSECUTIVE consecutive uncertain responses): Signals — $RECENT_SIGNALS. Consider spawning a deep-think-partner agent (Task tool, subagent_type='deep-think-partner') for thorough analysis instead of continuing to iterate."
  }
}
EOF

# Reset after delivering to prevent repeated suggestions
echo "0" > "$STRUGGLE_COUNT_FILE"

exit 0
