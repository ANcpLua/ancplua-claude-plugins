#!/usr/bin/env bash
# emit-agent-stop.sh — SubagentStop hook
# Creates an "agent/stop" span when a subagent finishes.

set -euo pipefail

COLLECTOR_URL="${QYL_COLLECTOR_URL:-http://localhost:5100}/v1/traces"

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id  // "unknown"')
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_name  // "unknown"')
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type  // ""')
AGENT_ID=$(echo "$INPUT"   | jq -r '.agent_id    // ""')
CWD=$(echo "$INPUT"        | jq -r '.cwd         // ""')

TRACE_ID=$(printf '%s' "$SESSION_ID" | md5 -q 2>/dev/null \
        || printf '%s' "$SESSION_ID" | md5sum | cut -c1-32)
TRACE_ID="${TRACE_ID:0:32}"

SPAN_KEY="${SESSION_ID}:agent_stop:${AGENT_NAME}:${AGENT_ID}"
SPAN_ID=$(printf '%s' "$SPAN_KEY" | md5 -q 2>/dev/null \
       || printf '%s' "$SPAN_KEY" | md5sum | cut -c1-16)
SPAN_ID="${SPAN_ID:0:16}"

# Parent span = the start span for this agent
PARENT_KEY="${SESSION_ID}:agent_start:${AGENT_NAME}"
PARENT_ID=$(printf '%s' "$PARENT_KEY" | md5 -q 2>/dev/null \
         || printf '%s' "$PARENT_KEY" | md5sum | cut -c1-16)
PARENT_ID="${PARENT_ID:0:16}"

NOW_NS=$(python3 -c "import time; print(int(time.time() * 1e9))" 2>/dev/null \
      || date +%s000000000)

OTLP_PAYLOAD=$(jq -n \
  --arg trace_id "$TRACE_ID" --arg span_id "$SPAN_ID" --arg parent_id "$PARENT_ID" \
  --arg agent "$AGENT_NAME" --arg type "$AGENT_TYPE" --arg agent_id "$AGENT_ID" \
  --arg session "$SESSION_ID" --arg cwd "$CWD" --arg now_ns "$NOW_NS" \
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
          traceId: $trace_id, spanId: $span_id, parentSpanId: $parent_id,
          name: ("agent/stop:" + $agent), kind: 1,
          startTimeUnixNano: $now_ns, endTimeUnixNano: $now_ns,
          attributes: [
            { key: "agent.name", value: { stringValue: $agent } },
            { key: "agent.type", value: { stringValue: $type } },
            { key: "agent.id",   value: { stringValue: $agent_id } },
            { key: "event",      value: { stringValue: "SubagentStop" } }
          ],
          status: { code: 1 }
        }]
      }]
    }]
  }')

curl -s -X POST "$COLLECTOR_URL" \
  -H "Content-Type: application/json" \
  -d "$OTLP_PAYLOAD" \
  --max-time 2 > /dev/null 2>&1 || true
