#!/usr/bin/env bash
# emit-span.sh — PostToolUse hook
# Transforms Claude Code tool calls into OTLP spans and POSTs to the collector.
# Silently no-ops when collector is unreachable. Never blocks the agent.

set -euo pipefail

COLLECTOR_URL="${QYL_COLLECTOR_URL:-http://localhost:5100}/v1/traces"

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id  // "unknown"')
TOOL_NAME=$(echo "$INPUT"  | jq -r '.tool_name   // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | jq -r '.tool_use_id // "unknown"')
CWD=$(echo "$INPUT"        | jq -r '.cwd         // ""')
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_name  // ""')
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type  // ""')

# Derive traceId deterministically from session_id (one trace per session)
TRACE_ID=$(printf '%s' "$SESSION_ID" | md5 -q 2>/dev/null \
        || printf '%s' "$SESSION_ID" | md5sum | cut -c1-32)
TRACE_ID="${TRACE_ID:0:32}"

# Derive spanId from tool_use_id (unique per tool call)
SPAN_ID=$(printf '%s' "$TOOL_USE_ID" | md5 -q 2>/dev/null \
       || printf '%s' "$TOOL_USE_ID" | md5sum | cut -c1-16)
SPAN_ID="${SPAN_ID:0:16}"

NOW_NS=$(python3 -c "import time; print(int(time.time() * 1e9))" 2>/dev/null \
      || date +%s000000000)

TOOL_ATTRS=$(echo "$INPUT" | jq -c '[
  if .tool_input.file_path     then { key: "file.path",           value: { stringValue: .tool_input.file_path } }               else empty end,
  if .tool_input.command       then { key: "bash.command",        value: { stringValue: (.tool_input.command | .[0:500]) } }     else empty end,
  if .tool_input.pattern       then { key: "search.pattern",      value: { stringValue: .tool_input.pattern } }                 else empty end,
  if .tool_input.query         then { key: "search.query",        value: { stringValue: .tool_input.query } }                   else empty end,
  if .tool_input.url           then { key: "http.url",            value: { stringValue: .tool_input.url } }                     else empty end,
  if .tool_input.content       then { key: "file.size_bytes",     value: { intValue: (.tool_input.content | length | tostring) } } else empty end,
  if .tool_input.prompt        then { key: "task.prompt",         value: { stringValue: (.tool_input.prompt | .[0:200]) } }     else empty end,
  if .tool_input.subagent_type then { key: "task.subagent_type",  value: { stringValue: .tool_input.subagent_type } }           else empty end
]')

AGENT_ATTRS=$(jq -cn \
  --arg name "$AGENT_NAME" --arg type "$AGENT_TYPE" \
  '[
    if $name != "" then { key: "agent.name", value: { stringValue: $name } } else empty end,
    if $type != "" then { key: "agent.type", value: { stringValue: $type } } else empty end
  ]')

ALL_ATTRS=$(jq -cn \
  --arg tool "$TOOL_NAME" \
  --argjson tool_attrs "$TOOL_ATTRS" \
  --argjson agent_attrs "$AGENT_ATTRS" \
  '[{ key: "tool.name", value: { stringValue: $tool } }] + $tool_attrs + $agent_attrs')

OTLP_PAYLOAD=$(jq -n \
  --arg trace_id "$TRACE_ID" --arg span_id "$SPAN_ID" \
  --arg tool "$TOOL_NAME" --arg session "$SESSION_ID" --arg cwd "$CWD" \
  --arg now_ns "$NOW_NS" --argjson attrs "$ALL_ATTRS" \
  '{
    resourceSpans: [{
      resource: { attributes: [
        { key: "service.name", value: { stringValue: "claude-code" } },
        { key: "session.id",   value: { stringValue: $session } },
        { key: "process.cwd",  value: { stringValue: $cwd } }
      ]},
      scopeSpans: [{
        scope: { name: "claude-code.hooks", version: "1.0.0" },
        spans: [{
          traceId: $trace_id, spanId: $span_id,
          name: ("tool/" + $tool), kind: 3,
          startTimeUnixNano: $now_ns, endTimeUnixNano: $now_ns,
          attributes: $attrs, status: { code: 1 }
        }]
      }]
    }]
  }')

curl -s -X POST "$COLLECTOR_URL" \
  -H "Content-Type: application/json" \
  -d "$OTLP_PAYLOAD" \
  --max-time 2 > /dev/null 2>&1 || true
