#!/usr/bin/env bash
# =============================================================================
# PRE-COMMIT GATE - Blocks commits with integrity violations
# =============================================================================
# Trigger: PreToolUse (Bash)
# Purpose: Detect git commit commands and run integrity check before allowing
# =============================================================================

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

# Read tool input from stdin
INPUT=$(cat 2>/dev/null || true)
[[ -z "$INPUT" ]] && exit 0

# Extract the bash command
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
[[ -z "$COMMAND" ]] && exit 0

# Only check git commit commands
if ! echo "$COMMAND" | grep -qE 'git\s+commit'; then
    exit 0
fi

# Check if we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    exit 0
fi

# Check if there are staged changes
if ! git diff --cached --quiet 2>/dev/null; then
    # Run the integrity check
    CHECK_OUTPUT=$("$PLUGIN_ROOT/scripts/integrity-check.sh" 2>&1 || true)
    CHECK_EXIT=$?

    if [[ "$CHECK_EXIT" -ne 0 ]]; then
        # Violations found - block the commit
        # Escape the output for JSON
        ESCAPED_OUTPUT=$(echo "$CHECK_OUTPUT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

        cat << EOF
{
  "decision": "block",
  "reason": "COMPLETION INTEGRITY: Violations detected in staged changes",
  "message": "BLOCKED: Cannot commit with integrity violations.\\n\\n${ESCAPED_OUTPUT}\\n\\nFix these issues before committing:\\n1. Remove warning suppressions - fix the actual warnings\\n2. Uncomment or properly delete tests - don't hide them\\n3. Keep assertions - they exist for a reason\\n\\nIf you believe these are false positives, explain why in the commit message."
}
EOF
        exit 0
    fi
fi

# No issues - allow commit
exit 0
