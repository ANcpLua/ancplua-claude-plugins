#!/bin/bash
# =============================================================================
# STRUGGLE DETECTOR - Detects when Claude is uncertain/struggling
# =============================================================================
# Trigger: Stop (after Claude responds)
# Purpose: Detect hedging, vagueness, contradictions -> suggest deep-thinker
#
# Signals detected:
#   - Hedging language ("I think", "probably", "might", "I'm not sure")
#   - Long responses without code/concrete actions
#   - Repeated questions back (avoiding action)
#   - Contradiction patterns
#   - Apologetic patterns
#   - Weasel words
# =============================================================================

set -euo pipefail

# Use plugin-local blackboard for state persistence
BLACKBOARD="${CLAUDE_PLUGIN_ROOT:-.}/.blackboard"
STRUGGLE_FILE="$BLACKBOARD/.struggle-signals"
STRUGGLE_COUNT_FILE="$BLACKBOARD/.struggle-count"

mkdir -p "$BLACKBOARD" 2>/dev/null || true

# Read Claude's response from stdin
RESPONSE=$(cat 2>/dev/null || true)

[[ -z "$RESPONSE" ]] && exit 0

# =============================================================================
# SIGNAL DETECTION
# =============================================================================

signals=()
score=0

# 1. HEDGING LANGUAGE (uncertainty markers)
HEDGE_COUNT=$(echo "$RESPONSE" | grep -ciE "I think|I believe|probably|might be|could be|I'm not sure|not certain|unclear|I assume|possibly|perhaps" || true)
if [[ "$HEDGE_COUNT" -gt 3 ]]; then
    signals+=("hedging:$HEDGE_COUNT instances of uncertain language")
    score=$((score + HEDGE_COUNT * 2))
fi

# 2. EXCESSIVE QUESTIONS (avoiding action)
QUESTION_COUNT=$(echo "$RESPONSE" | grep -c "?" || true)
RESPONSE_LINES=$(echo "$RESPONSE" | wc -l | tr -d ' ')
if [[ "$QUESTION_COUNT" -gt 3 && "$RESPONSE_LINES" -lt 30 ]]; then
    signals+=("deflecting:$QUESTION_COUNT questions in short response")
    score=$((score + QUESTION_COUNT * 3))
fi

# 3. LONG RESPONSE WITHOUT CODE (vague rambling)
WORD_COUNT=$(echo "$RESPONSE" | wc -w | tr -d ' ')
CODE_BLOCKS=$(echo "$RESPONSE" | grep -c '```' || true)
if [[ "$WORD_COUNT" -gt 400 && "$CODE_BLOCKS" -lt 2 ]]; then
    signals+=("verbose:$WORD_COUNT words with only $CODE_BLOCKS code blocks")
    score=$((score + 10))
fi

# 4. CONTRADICTION PATTERNS
if echo "$RESPONSE" | grep -qiE "but (then again|on the other hand|however|actually)|wait,|no,? actually|I (was|am) wrong"; then
    signals+=("contradiction:self-correction detected")
    score=$((score + 15))
fi

# 5. APOLOGETIC PATTERNS (sign of prior failure)
APOLOGY_COUNT=$(echo "$RESPONSE" | grep -ciE "sorry|apologize|my mistake|I was wrong|let me try again|I missed" || true)
if [[ "$APOLOGY_COUNT" -gt 1 ]]; then
    signals+=("apologetic:$APOLOGY_COUNT apologies")
    score=$((score + APOLOGY_COUNT * 5))
fi

# 6. WEASEL WORDS (avoiding commitment)
WEASEL_COUNT=$(echo "$RESPONSE" | grep -ciE "generally|typically|usually|in most cases|it depends|that said|to be fair" || true)
if [[ "$WEASEL_COUNT" -gt 2 ]]; then
    signals+=("weaseling:$WEASEL_COUNT non-committal phrases")
    score=$((score + WEASEL_COUNT * 2))
fi

# =============================================================================
# TRACK CONSECUTIVE STRUGGLES
# =============================================================================

if [[ "$score" -gt 10 ]]; then
    # Increment struggle count
    PREV_COUNT=$(cat "$STRUGGLE_COUNT_FILE" 2>/dev/null || echo "0")
    NEW_COUNT=$((PREV_COUNT + 1))
    echo "$NEW_COUNT" > "$STRUGGLE_COUNT_FILE"
else
    # Reset on confident response
    echo "0" > "$STRUGGLE_COUNT_FILE"
    rm -f "$STRUGGLE_FILE" 2>/dev/null
    exit 0
fi

# =============================================================================
# OUTPUT SUGGESTION IF THRESHOLD MET
# =============================================================================

CONSECUTIVE=$(cat "$STRUGGLE_COUNT_FILE" 2>/dev/null || echo "0")

# Log signals for debugging
{
    echo "---"
    echo "timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "score: $score"
    echo "consecutive: $CONSECUTIVE"
    for sig in "${signals[@]}"; do
        echo "  - $sig"
    done
} >> "$STRUGGLE_FILE"

# Trigger suggestion after 2+ consecutive struggling responses OR high single score
if [[ "$CONSECUTIVE" -ge 2 ]] || [[ "$score" -gt 25 ]]; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "<struggle-detected score=\"$score\" consecutive=\"$CONSECUTIVE\">\n\nClaude appears to be struggling with this problem.\n\nSignals detected:\n$(printf '- %s\\n' "${signals[@]}")\n\nSuggestion: Use the Task tool with subagent_type='deep-think-partner' for thorough analysis.\n\nExample: \"I'm finding this complex. Want me to spawn a deep-thinker for a more thorough analysis?\"\n</struggle-detected>"
  }
}
EOF
fi

exit 0
