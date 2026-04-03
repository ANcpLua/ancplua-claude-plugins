#!/usr/bin/env bash
# findings-inject.sh — SessionStart hook that injects prior scan findings as passive context.
# LAW 1: Passive context beats active retrieval. If findings exist, inject them.
# The skill body has IMPERATIVE instructions to USE injected findings — this closes the loop.
set -euo pipefail

FINDINGS=".eight-gates/artifacts/findings.json"

# No findings file = nothing to inject
if [ ! -f "$FINDINGS" ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":""}}'
  exit 0
fi

# Build compact findings index for injection
if command -v jq &>/dev/null; then
  TOTAL=$(jq -r '.total_findings // 0' "$FINDINGS")
  SESSION=$(jq -r '.session // "unknown"' "$FINDINGS")
  BY_CAT=$(jq -r '(.by_category // {}) | to_entries | map("\(.key):\(.value)") | join(" | ")' "$FINDINGS")
  SOURCE=$(jq -r '.source // "unknown"' "$FINDINGS")

  # Compact index: one line per finding (id, severity, title)
  INDEX=$(jq -r '(.findings // [])[] | "  \(.id) [\(.severity)] \(.title)"' "$FINDINGS" 2>/dev/null || echo "  (parse error)")

  CONTEXT="<EXODIA_FINDINGS_CONTEXT>
Prior scan data available — ${TOTAL} findings from ${SOURCE} (session: ${SESSION})
Categories: ${BY_CAT}
Source file: .eight-gates/artifacts/findings.json

${INDEX}

MANDATORY: Any Exodia skill invoked in this session MUST read .eight-gates/artifacts/findings.json
and filter findings matching its scope. Do NOT re-scan areas already covered by prior findings.
Each skill has a STEP -1 that tells you exactly how to filter and use these findings.
</EXODIA_FINDINGS_CONTEXT>"

  jq -n --arg ctx "$CONTEXT" '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
else
  # Minimal fallback without jq — still announce existence
  CONTEXT="<EXODIA_FINDINGS_CONTEXT>
Prior scan data available at .eight-gates/artifacts/findings.json
MANDATORY: Read and use findings. Do NOT re-scan. Filter by skill scope.
</EXODIA_FINDINGS_CONTEXT>"

  # Manual JSON escape (newlines)
  ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/\\t/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$ESCAPED\"}}"
fi
