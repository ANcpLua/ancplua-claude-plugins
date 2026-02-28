---
description: Check whether the OTLP collector is reachable and self-observability is active.
---

# /claude-self-obs:status

Check if the claude-self-obs plugin is actively sending spans.

## What this does

1. Reads `$QYL_COLLECTOR_URL` (default: `http://localhost:5100`)
2. Attempts a health check against the collector
3. Reports: **active** (spans flowing) or **standby** (silently dropping, collector unreachable)
4. Shows the last few span names received if the collector has a sessions API

## Steps

Run this in a Bash tool:

```bash
COLLECTOR="${QYL_COLLECTOR_URL:-http://localhost:5100}"

echo "Checking collector at $COLLECTOR..."

if curl -sf "$COLLECTOR/health" > /dev/null 2>&1 \
   || curl -sf "$COLLECTOR/api/v1/claude-code/sessions" > /dev/null 2>&1; then
  echo "✓ ACTIVE — spans are flowing to $COLLECTOR"
  echo ""
  echo "Recent sessions:"
  curl -sf "$COLLECTOR/api/v1/claude-code/sessions" | jq -r '.[] | "  \(.session_id[:8])...  \(.tool_count) spans"' 2>/dev/null || true
else
  echo "◌ STANDBY — collector unreachable at $COLLECTOR"
  echo "  Spans are silently dropped. Start qyl to begin collecting."
  echo "  To override URL: export QYL_COLLECTOR_URL=http://your-collector:port"
fi
```

## Enable / Disable

| Action | How |
|--------|-----|
| **Enable** | Start qyl collector (`dotnet run` in the qyl project) |
| **Disable** | Stop the collector — hook silently no-ops |
| **Change URL** | `export QYL_COLLECTOR_URL=http://other-host:5100` |
| **Uninstall** | Disable plugin in Claude Code settings |
