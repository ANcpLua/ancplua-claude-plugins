---
description: Check Claude Code observability status via qyl.mcp tools.
---

# /claude-self-obs:status

Check if Claude Code telemetry is flowing to qyl and show session stats.

## What this does

1. Calls `mcp__qyl__qyl_claude_code_sessions` to list recent sessions
2. If the current session has events, calls `mcp__qyl__qyl_claude_code_tools` for tool breakdown
3. Reports: **active** (events flowing) or **standby** (qyl.collector not reachable)

## Steps

1. Call `mcp__qyl__qyl_claude_code_sessions` with `limit=5`
2. If it succeeds, show the sessions table
3. For the most recent session, call `mcp__qyl__qyl_claude_code_tools` to show tool usage
4. If the MCP tool call fails, report that qyl.mcp is not connected

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| MCP tool not found | qyl.mcp not registered in `~/.claude/settings.json`. Add it to `mcpServers`. |
| No sessions found | Set `CLAUDE_CODE_ENABLE_TELEMETRY=1` and OTLP env vars. |
| qyl.collector unreachable | Start qyl.collector on `:5100`. Hook events silently fail when collector is down. |
