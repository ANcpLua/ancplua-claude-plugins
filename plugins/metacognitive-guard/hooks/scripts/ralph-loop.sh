#!/usr/bin/env bash
# =============================================================================
# RALPH LOOP - Antipattern Detection via Engineering Principles
# =============================================================================
# Trigger: PostToolUse (Write, Edit)
# Purpose: Silent when code is clean. Injects the RIGHT principle as context
#          override when drift patterns are detected in what was just written.
#          Named after Lord of the Flies' Ralph — invisible until you need him.
#
# Design: No LLM. No rotation. No noise. Pure grep-based antipattern detection.
#         Fires only when a signal matches. Otherwise: exit 0, zero output.
# =============================================================================

set -euo pipefail

# Read PostToolUse event from stdin
INPUT=$(cat 2>/dev/null || true)
[[ -z "$INPUT" ]] && exit 0

# Requires jq for JSON parsing
command -v jq &>/dev/null || exit 0

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.file // empty' 2>/dev/null || true)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null || true)

[[ -z "$CONTENT" ]] && exit 0

# Skip docs/config — only check code files
case "$FILE_PATH" in
  *.md|*.yaml|*.yml|*.json|*.txt|*.csv|*.xml|*.svg|*.lock|*.toml|*.ini) exit 0 ;;
esac

# Emit a principle and exit — only one principle per invocation
emit() {
  jq -n --arg ctx "$1" \
    '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":$ctx}}'
  exit 0
}

# =============================================================================
# ANTIPATTERN DETECTION — high signal, low false-positive
# =============================================================================

# 1. Band-aid markers: TODO/FIXME/HACK/WORKAROUND/KLUDGE
#    Signal: deferring root cause work
if echo "$CONTENT" | grep -qiE '\b(TODO|FIXME|HACK|WORKAROUND|XXX|KLUDGE)\b'; then
  emit "Ralph: Fix root causes, not symptoms — you just wrote a band-aid marker. Five Whys before moving on."
fi

# 2. Warning/lint suppressions: sweeping problems under the rug
#    Signal: suppressing instead of understanding
if echo "$CONTENT" | grep -qE '@SuppressWarnings|#pragma warning disable|eslint-disable|@ts-ignore|@ts-expect-error|# noqa|# type: ignore|# noinspection|// ReSharper disable'; then
  emit "Ralph: Understand why before moving on — dont suppress warnings, fix the underlying issue. What is the warning telling you?"
fi

# 3. Catch-all exception handling: silent failure factory
#    Signal: hiding errors instead of handling them
if echo "$CONTENT" | grep -qE 'catch\s*\(\s*(Exception|Error)\s|catch\s*\(\s*\)|except\s*:|except\s+Exception\b|rescue\s*$|rescue\s+=>'; then
  emit "Ralph: Fail loud and immediately — catch-all exception handling hides bugs. Be specific about what you catch and why."
fi

# 4. Massive single write: dumping too much at once
#    Signal: not iterating, not decomposing
line_count=$(echo "$CONTENT" | wc -l | tr -d ' ')
if [[ "$line_count" -gt 150 ]]; then
  emit "Ralph: Less code = better code — ${line_count} lines in one write. Does every line justify its existence? Ship early, iterate."
fi

# 5. Empty catch/error blocks: swallowing failures silently
#    Signal: log-and-continue or ignore-and-pray
if echo "$CONTENT" | grep -qE 'catch\s*\([^)]*\)\s*\{\s*\}|except[^:]*:\s*pass|rescue\s*;\s*end'; then
  emit "Ralph: Fail loud and immediately — empty catch block swallows errors. At minimum log the error. Better: handle it properly."
fi

# No antipattern detected — Ralph stays silent
exit 0
