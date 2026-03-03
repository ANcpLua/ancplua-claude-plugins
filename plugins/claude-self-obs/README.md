# claude-self-obs

**Claude Code observes itself.**

Every tool call, agent spawn, and agent stop becomes a queryable event.
Claude can ask "what tools have I used this session?" and get an answer from its own telemetry.

## Architecture

```text
Claude Code session
  │
  │ PostToolUse / SubagentStart / SubagentStop
  │ (type: "http" hooks — native JSON POST, no scripts)
  │
  ▼
┌──────────────────────────────────┐
│  self-obs MCP server             │
│  (stdio MCP + :5101 HTTP)        │
│                                  │
│  POST /v1/events   ← hooks POST │
│  MCP tools:        ← Claude asks │
│    get_status()                  │
│    get_session_timeline()        │
│    get_tool_stats()              │
│    search_events()               │
│                                  │
│  Storage: in-memory ring buffer  │
└──────────────────────────────────┘
```

## How it works

1. **HTTP hooks** fire on every tool call and agent lifecycle event
2. Claude Code POSTs the raw event JSON to `localhost:5101/v1/events`
3. The **MCP server** stores events in a ring buffer (10k per session)
4. Claude queries its own telemetry via MCP tools

No bash scripts, no jq, no curl, no python3. Pure HTTP + MCP.

## Events captured

| Hook | Event type | Key fields |
|------|-----------|------------|
| PostToolUse | Tool call | `tool_name`, `tool_input` (file_path, command, pattern, etc.) |
| SubagentStart | Agent spawn | `agent_name`, `agent_type` |
| SubagentStop | Agent finish | `agent_name`, `agent_type`, `agent_id` |

## MCP tools

| Tool | Purpose |
|------|---------|
| `get_status` | Server health: uptime, event count, session count |
| `get_session_timeline` | Ordered event list for a session |
| `get_tool_stats` | Tool call counts grouped by name |
| `search_events` | Search events by tool/agent/pattern |

## Commands

| Command | What it does |
|---------|-------------|
| `/claude-self-obs:status` | Check server health and show tool stats |

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `SELF_OBS_PORT` | `5101` | HTTP port for hook events |
| `SELF_OBS_MAX_EVENTS` | `10000` | Ring buffer size per session |

## Relationship to native OTLP (spec-0002)

These are complementary:

| Source | What it provides | Where it goes |
|--------|-----------------|---------------|
| Native OTLP (env vars) | Metrics (tokens, cost, LOC) + events | OTel Collector → qyl |
| HTTP hooks → MCP server | Tool inputs, agent lifecycle, real-time query | MCP server → Claude |

Native OTLP gives you the *what* (counters, costs). Hooks give you the *how* (file paths, commands, patterns).
