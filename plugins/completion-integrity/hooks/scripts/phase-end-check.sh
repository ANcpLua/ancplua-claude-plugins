#!/usr/bin/env bash
# =============================================================================
# PHASE-END CHECK - Detects premature completion claims
# =============================================================================
# Trigger: Stop (after Claude responds)
# Purpose: Detect when Claude claims completion while problems remain
# =============================================================================

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

BLACKBOARD="$PLUGIN_ROOT/.blackboard"
mkdir -p "$BLACKBOARD" 2>/dev/null || true

# Read Claude's response from stdin
RESPONSE=$(cat 2>/dev/null || true)
[[ -z "$RESPONSE" ]] && exit 0

# =============================================================================
# COMPLETION CLAIM DETECTION
# =============================================================================

# Check if response contains completion claims
COMPLETION_CLAIM=false
if echo "$RESPONSE" | grep -qiE \
    "done!|finished!|complete!|all set|that.s it|ready to|we.re done|task complete|implementation complete|fixed!|working now|should work|tests pass"; then
    COMPLETION_CLAIM=true
fi

# If no completion claim, nothing to check
[[ "$COMPLETION_CLAIM" != "true" ]] && exit 0

# =============================================================================
# CHECK FOR RED FLAGS IN RECENT RESPONSE
# =============================================================================

signals=()
score=0

# 1. Mentioned but didn't run tests
if echo "$RESPONSE" | grep -qiE "tests? (should|will|would) pass|should work"; then
    if ! echo "$RESPONSE" | grep -qiE "dotnet test|npm test|pytest|go test|jest|vitest"; then
        signals+=("untested_claim:Claimed tests pass without running them")
        score=$((score + 20))
    fi
fi

# 2. Mentioned errors/warnings but dismissed them
if echo "$RESPONSE" | grep -qiE "warning|error" && \
   echo "$RESPONSE" | grep -qiE "can (be )?ignore|not important|minor|doesn.t matter|safe to ignore"; then
    signals+=("dismissed_warning:Dismissed warnings/errors as unimportant")
    score=$((score + 15))
fi

# 3. Used words suggesting incomplete work
if echo "$RESPONSE" | grep -qiE "for now|later|todo|fixme|hack|temporary|workaround|quick fix"; then
    signals+=("deferred_work:Completion claim with deferred work mentioned")
    score=$((score + 10))
fi

# 4. Deleted or commented code instead of fixing
if echo "$RESPONSE" | grep -qiE "commented out|removed|deleted.*test|disabled.*test"; then
    signals+=("deleted_instead_of_fixed:Removed code instead of fixing it")
    score=$((score + 25))
fi

# 5. Added suppressions
if echo "$RESPONSE" | grep -qiE "pragma warning|eslint-disable|noqa|ts-ignore|suppress"; then
    signals+=("added_suppression:Added warning suppression")
    score=$((score + 20))
fi

# =============================================================================
# OUTPUT WARNING IF ISSUES DETECTED
# =============================================================================

if [[ "$score" -gt 10 ]]; then
    SIGNALS_LIST=""
    for sig in "${signals[@]}"; do
        SIGNALS_LIST="${SIGNALS_LIST}- ${sig}\\n"
    done

    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "<completion-integrity-warning score=\"$score\">\\n\\nCompletion claim detected but integrity issues found:\\n\\n${SIGNALS_LIST}\\nBefore claiming completion:\\n1. Run the actual tests (don't assume they pass)\\n2. Fix warnings instead of suppressing them\\n3. Fix code instead of deleting/commenting it\\n4. Complete TODOs or explicitly defer them to the user\\n\\nDo you want to verify the work is actually complete?\\n</completion-integrity-warning>"
  }
}
EOF
fi

exit 0
