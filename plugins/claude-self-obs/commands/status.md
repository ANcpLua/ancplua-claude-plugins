---
description: Check whether the self-obs MCP server is running and show event stats.
---

# /claude-self-obs:status

Check if the claude-self-obs MCP server is alive and reporting.

## What this does

1. Calls `mcp__claude_self_obs__get_status` to check server health
2. Calls `mcp__claude_self_obs__get_tool_stats` to show tool call breakdown
3. Reports: **active** (server running, events flowing) or **inactive** (MCP server not connected)

## Steps

Use the MCP tools directly — no bash needed:

1. Call `mcp__claude_self_obs__get_status` with no arguments
2. If it succeeds, the server is active. Report uptime, total events, and session count.
3. Call `mcp__claude_self_obs__get_tool_stats` to show tool usage breakdown.
4. If the MCP tool call fails, report that the self-obs server is not running.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| MCP tool not found | Plugin not enabled or server failed to start. Check `claude mcp list`. |
| Server running but no events | HTTP hooks may not be firing. Check `/hooks` menu for claude-self-obs entries. |
| Port conflict on 5101 | Set `SELF_OBS_PORT` env var to a different port in plugin config. |
