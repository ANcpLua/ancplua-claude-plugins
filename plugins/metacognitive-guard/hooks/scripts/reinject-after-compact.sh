#!/usr/bin/env bash
# =============================================================================
# REINJECT AFTER COMPACT — Self-healing context after compaction
# =============================================================================
# Trigger: SessionStart with matcher "compact"
# Purpose: CLAUDE.md, rules, and MEMORY.md auto-reload after compaction.
#          This hook re-injects workflow reminders that lived in conversation.
# Keep output under 50 lines (official guidance).
# =============================================================================

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

# Consume stdin (hook input)
cat > /dev/null

cat << 'CONTEXT'
## Post-Compaction Context

Session was compacted. CLAUDE.md, rules, and MEMORY.md reloaded automatically.

**What was lost:** Earlier conversation turns, tool outputs, intermediate findings.

**Recovery steps:**
1. `git status` + `git log --oneline -5` for recent work
2. CHANGELOG.md `[Unreleased]` for task continuity
3. Ask the user what you were working on if unclear

**Workflow reminders:**
- Skill check mandatory before every task
- TDD: RED → GREEN → REFACTOR
- `./tooling/scripts/weave-validate.sh` must pass before claiming done
- CHANGELOG.md entry required for every change
- Never suppress warnings — fix root causes
CONTEXT

exit 0
