#!/usr/bin/env bash
# =============================================================================
# PHASE-END CHECK - Detects premature completion claims
# =============================================================================
# Trigger: Stop (after Claude responds)
# Purpose: Detect when Claude claims completion while problems remain
#
# Scoring thresholds:
#   - Individual signals add 10-25 points based on severity
#   - Score > 10 triggers a warning (catches 1+ medium or 2+ low signals)
#   - This threshold balances sensitivity vs false positive rate
# =============================================================================

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "${PLUGIN_ROOT}" ]] && exit 0

# Read Claude's response from stdin
RESPONSE=$(cat 2>/dev/null || true)
[[ -z "${RESPONSE}" ]] && exit 0

# =============================================================================
# COMPLETION CLAIM DETECTION
# =============================================================================

# Check if response contains completion claims
COMPLETION_CLAIM=false
if echo "${RESPONSE}" | grep -qiE \
    "done!|finished!|complete!|all set|that.s it|ready to|we.re done|task complete|implementation complete|fixed!|working now"; then
    COMPLETION_CLAIM=true
fi

# If no completion claim, nothing to check
[[ "${COMPLETION_CLAIM}" != "true" ]] && exit 0

# =============================================================================
# CHECK FOR RED FLAGS IN RECENT RESPONSE
# =============================================================================

signals=()
score=0

# Scoring rationale:
# - 20-25 points: High severity (likely shortcuts)
# - 10-15 points: Medium severity (suspicious patterns)
# - Threshold of 10 means any single medium+ signal triggers warning

# 1. Mentioned but didn't run tests (HIGH: 20 points)
if echo "${RESPONSE}" | grep -qiE "tests? (should|will|would) pass"; then
    if ! echo "${RESPONSE}" | grep -qiE "dotnet test|npm test|pytest|go test|jest|vitest"; then
        signals+=("untested_claim: Claimed tests pass without running them")
        score=$((score + 20))
    fi
fi

# 2. Mentioned errors/warnings but dismissed them (MEDIUM: 15 points)
if echo "${RESPONSE}" | grep -qiE "warning|error" && \
   echo "${RESPONSE}" | grep -qiE "can (be )?ignore|not important|minor|doesn.t matter|safe to ignore"; then
    signals+=("dismissed_warning: Dismissed warnings/errors as unimportant")
    score=$((score + 15))
fi

# 3. Used words suggesting incomplete work (MEDIUM: 10 points)
if echo "${RESPONSE}" | grep -qiE "for now|later|todo|fixme|hack|temporary|workaround|quick fix"; then
    signals+=("deferred_work: Completion claim with deferred work mentioned")
    score=$((score + 10))
fi

# 4. Deleted or commented code instead of fixing (HIGH: 25 points)
if echo "${RESPONSE}" | grep -qiE "commented out|removed|deleted.*test|disabled.*test"; then
    signals+=("deleted_instead_of_fixed: Removed code instead of fixing it")
    score=$((score + 25))
fi

# 5. Added suppressions (HIGH: 20 points)
if echo "${RESPONSE}" | grep -qiE "pragma warning|eslint-disable|noqa|ts-ignore|suppress"; then
    signals+=("added_suppression: Added warning suppression")
    score=$((score + 20))
fi

# =============================================================================
# OUTPUT WARNING IF ISSUES DETECTED
# Threshold: 10 points (any medium+ signal or multiple low signals)
# =============================================================================

WARNING_THRESHOLD=10

if [[ "${score}" -gt "${WARNING_THRESHOLD}" ]]; then
    # Build signals list for JSON
    SIGNALS_JSON=$(printf '%s\n' "${signals[@]}" | jq -R -s 'split("\n") | map(select(length > 0))')

    # Use jq for safe JSON construction
    jq -n \
        --argjson score "${score}" \
        --argjson signals "${SIGNALS_JSON}" \
        '{
          hookSpecificOutput: {
            hookEventName: "Stop",
            additionalContext: (
              "<completion-integrity-warning score=\"" + ($score | tostring) + "\">\n\n"
              + "Completion claim detected but integrity issues found:\n\n"
              + ($signals | map("- " + .) | join("\n"))
              + "\n\nBefore claiming completion:\n"
              + "1. Run the actual tests (do not assume they pass)\n"
              + "2. Fix warnings instead of suppressing them\n"
              + "3. Fix code instead of deleting/commenting it\n"
              + "4. Complete TODOs or explicitly defer them to the user\n\n"
              + "Do you want to verify the work is actually complete?\n"
              + "</completion-integrity-warning>"
            )
          }
        }'
fi

exit 0
