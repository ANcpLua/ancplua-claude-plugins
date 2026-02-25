#!/usr/bin/env bash
# =============================================================================
# STRUGGLE DETECTOR - Detects when Claude is uncertain/struggling
# =============================================================================
# Trigger: Stop (async, after Claude responds)
# Purpose: Detect hedging, vagueness, contradictions -> suggest deep-thinker
#
# Input: Stop hook JSON on stdin (contains transcript_path)
# Method: Reads last assistant message from transcript JSONL
#
# Signals detected:
#   - Hedging language ("I think", "probably", "might", "I'm not sure")
#   - Long responses without code/concrete actions
#   - Repeated questions back (avoiding action)
#   - Contradiction patterns
#   - Apologetic patterns
#   - Weasel words
#   - Restarting patterns
#   - Missing recommendations
# =============================================================================

set -euo pipefail

# Ensure CLAUDE_PLUGIN_ROOT is set by Claude Code runtime
if [[ -z "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
    exit 0  # Silently exit if not in plugin context
fi

BLACKBOARD="$CLAUDE_PLUGIN_ROOT/.blackboard"
STRUGGLE_FILE="$BLACKBOARD/.struggle-signals"
STRUGGLE_COUNT_FILE="$BLACKBOARD/.struggle-count"

mkdir -p "$BLACKBOARD" 2>/dev/null || true

# Read Stop hook JSON input from stdin
INPUT=$(cat 2>/dev/null || true)
[[ -z "$INPUT" ]] && exit 0

# Extract transcript path from hook input
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
[[ -z "$TRANSCRIPT" || ! -f "$TRANSCRIPT" ]] && exit 0

# Extract last assistant message from transcript JSONL
# Each line is a JSON object; find the last one with type=assistant
RESPONSE=$(tail -50 "$TRANSCRIPT" | jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' 2>/dev/null | tail -1)
[[ -z "$RESPONSE" ]] && exit 0

# =============================================================================
# SIGNAL DETECTION
# =============================================================================

signals=()
score=0

# 1. HEDGING LANGUAGE (uncertainty markers) - count each instance
# Note: Use subshell with || true to prevent pipefail from causing double output
HEDGE_COUNT=$(echo "$RESPONSE" | { grep -oiE \
    "I think|I believe|probably|might be|could be|I'm not sure|not certain|unclear|I assume|possibly|perhaps" 2>/dev/null || true; } \
    | wc -l | tr -d ' \n')
HEDGE_COUNT=${HEDGE_COUNT:-0}
if [[ "$HEDGE_COUNT" -gt 3 ]]; then
    signals+=("hedging:$HEDGE_COUNT instances of uncertain language")
    score=$((score + HEDGE_COUNT * 2))
fi

# 2. EXCESSIVE QUESTIONS (avoiding action) - count each question mark
QUESTION_COUNT=$(echo "$RESPONSE" | { grep -o '?' 2>/dev/null || true; } | wc -l | tr -d ' \n')
QUESTION_COUNT=${QUESTION_COUNT:-0}
RESPONSE_LINES=$(echo "$RESPONSE" | wc -l | tr -d ' \n')
if [[ "$QUESTION_COUNT" -gt 3 && "$RESPONSE_LINES" -lt 30 ]]; then
    signals+=("deflecting:$QUESTION_COUNT questions in short response")
    score=$((score + QUESTION_COUNT * 2))
fi

# 3. LONG RESPONSE WITHOUT CODE (vague rambling)
WORD_COUNT=$(echo "$RESPONSE" | wc -w | tr -d ' \n')
# Count actual code blocks (pairs of ```)
BACKTICK_COUNT=$(echo "$RESPONSE" | grep -c '```' || true)
CODE_BLOCKS=$((BACKTICK_COUNT / 2))
if [[ "$WORD_COUNT" -gt 400 && "$CODE_BLOCKS" -lt 2 ]]; then
    signals+=("verbose:$WORD_COUNT words with only $CODE_BLOCKS code blocks")
    score=$((score + 5 + (WORD_COUNT - 400) / 100))
fi

# 4. CONTRADICTION PATTERNS
if echo "$RESPONSE" | grep -qiE \
    "but (then again|on the other hand|however|actually)|wait,|no,? actually|I (was|am) wrong"; then
    signals+=("contradiction:self-correction detected")
    score=$((score + 15))
fi

# 5. APOLOGETIC PATTERNS (sign of prior failure) - count each instance
APOLOGY_COUNT=$(echo "$RESPONSE" | { grep -oiE \
    "sorry|apologize|my mistake|I was wrong|let me try again|I missed" 2>/dev/null || true; } \
    | wc -l | tr -d ' \n')
APOLOGY_COUNT=${APOLOGY_COUNT:-0}
if [[ "$APOLOGY_COUNT" -gt 1 ]]; then
    signals+=("apologetic:$APOLOGY_COUNT apologies")
    score=$((score + APOLOGY_COUNT * 8))
fi

# 6. WEASEL WORDS (avoiding commitment) - count each instance
WEASEL_COUNT=$(echo "$RESPONSE" | { grep -oiE \
    "generally|typically|usually|in most cases|it depends|that said|to be fair" 2>/dev/null || true; } \
    | wc -l | tr -d ' \n')
WEASEL_COUNT=${WEASEL_COUNT:-0}
if [[ "$WEASEL_COUNT" -gt 2 ]]; then
    signals+=("weaseling:$WEASEL_COUNT non-committal phrases")
    score=$((score + WEASEL_COUNT * 3))
fi

# 7. RESTART PATTERNS (giving up on current approach)
if echo "$RESPONSE" | grep -qiE \
    "let me (start over|try again|rethink|approach this differently)|starting from scratch|different approach"; then
    signals+=("restarting:abandoning current approach")
    score=$((score + 20))
fi

# 8. MISSING RECOMMENDATION (long response without clear advice)
if [[ "$WORD_COUNT" -gt 200 ]]; then
    if ! echo "$RESPONSE" | grep -qiE \
        "I recommend|you should|I suggest|my recommendation|the best approach|I would"; then
        signals+=("no-recommendation:long response without clear advice")
        score=$((score + 8))
    fi
fi

# NEGATIVE SIGNAL: Active tool use indicates working, not struggling
TOOL_CALLS=$(echo "$RESPONSE" | grep -ciE \
    "let me (read|search|check|look|examine|run|use)" || true)
if [[ "$TOOL_CALLS" -gt 0 ]]; then
    score=$((score - TOOL_CALLS * 5))
    [[ "$score" -lt 0 ]] && score=0
fi

# =============================================================================
# TRACK CONSECUTIVE STRUGGLES
# =============================================================================

if [[ "$score" -gt 10 ]]; then
    PREV_COUNT=$(cat "$STRUGGLE_COUNT_FILE" 2>/dev/null || echo "0")
    NEW_COUNT=$((PREV_COUNT + 1))
    echo "$NEW_COUNT" > "$STRUGGLE_COUNT_FILE"
else
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

# Note: No JSON output needed here. The struggle-inject.sh (UserPromptSubmit)
# reads .blackboard/.struggle-count and injects additionalContext to Claude
# on the next prompt. This async Stop hook only does analysis + blackboard writes.

exit 0
