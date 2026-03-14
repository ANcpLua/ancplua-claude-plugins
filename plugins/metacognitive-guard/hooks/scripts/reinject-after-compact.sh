#!/usr/bin/env bash
# =============================================================================
# REINJECT AFTER COMPACT — Self-healing context after compaction
# =============================================================================
# Trigger: SessionStart with matcher "compact"
# Purpose: CLAUDE.md, rules, and MEMORY.md auto-reload after compaction.
#          This hook re-injects workflow reminders that lived in conversation.
# Output:  JSON hookSpecificOutput (same contract as truth-beacon.sh)
# =============================================================================

set -euo pipefail

# Guard: only run when plugin is loaded (consistent with all hook scripts)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

# Consume stdin (hook input)
cat > /dev/null

CONTEXT="## Post-Compaction Context

Session was compacted. CLAUDE.md, rules, and MEMORY.md reloaded automatically.

**What was lost:** Earlier conversation turns, tool outputs, intermediate findings.

**Recovery steps:**
1. git status + git log --oneline -5 for recent work
2. CHANGELOG.md [Unreleased] for task continuity
3. Ask the user what you were working on if unclear

**Workflow reminders:**
- Skill check mandatory before every task
- TDD: RED -> GREEN -> REFACTOR
- ./tooling/scripts/weave-validate.sh must pass before claiming done
- CHANGELOG.md entry required for every change
- Never suppress warnings -- fix root causes"

# Emit JSON hookSpecificOutput (same contract as truth-beacon.sh)
if command -v jq &>/dev/null; then
  jq -n --arg ctx "$CONTEXT" '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
else
  ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$ESCAPED\"}}"
fi
