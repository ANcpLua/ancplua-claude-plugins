# Design: claude-self-obs v3 — qyl-integrated observability

**Date:** 2026-03-03
**Author:** Alexander + Claude Opus 4.6
**Status:** Approved
**Repos affected:** ancplua-claude-plugins (plugin), qyl (collector + MCP server)

---

## Problem

claude-self-obs v2.0.0 ships a standalone TypeScript MCP server (`server/src/`) that duplicates
what qyl.mcp already provides. Two MCP servers solving the same problem:

| Feature | Standalone server (plugin) | qyl.mcp (.NET) |
|---------|---------------------------|----------------|
| Session list | `get_session_timeline` | `qyl.claude_code_sessions` |
| Timeline | `get_session_timeline` | `qyl.claude_code_timeline` |
| Tool stats | `get_tool_stats` | `qyl.claude_code_tools` |
| Storage | In-memory ring buffer | DuckDB via qyl.collector |
| Persistence | None (lost on restart) | Full (DuckDB) |
| Auth | None | Token-based (`QYL_MCP_TOKEN`) |
| Resilience | None | Retry + circuit breaker |

The standalone server is worse in every dimension. It exists because the previous implementation
didn't know qyl.mcp already had ClaudeCodeTools.

### v1 → v2 → v3 progression

| Version | Approach | Lines | Problem |
|---------|----------|-------|---------|
| v1.0.0 | Bash scripts (jq + curl + python3) | 210 lines bash | Old tech documented as new |
| v2.0.0 | Standalone TypeScript MCP server | ~300 lines TS + 58K npm | Duplicates qyl.mcp |
| **v3.0.0** | **HTTP hooks → qyl.collector → qyl.mcp** | **~40 lines JSON** | **None** |

---

## Solution: Three gaps to close

### Gap 1: Hook ingest endpoint on qyl.collector

**Repo:** qyl
**File:** `src/qyl.collector/Program.cs` → inside `MapClaudeCodeEndpoints()`
**Endpoint:** `POST /api/v1/claude-code/hooks`

Receives raw Claude Code hook JSON (the exact payload Claude Code sends via HTTP hooks):

```json
{
  "session_id": "abc-123",
  "tool_name": "Read",
  "tool_use_id": "toolu_xyz",
  "tool_input": { "file_path": "/some/file.ts" },
  "cwd": "/Users/ancplua/project",
  "agent_name": "",
  "agent_type": ""
}
```

The endpoint:

1. Parses the hook JSON
1. Transforms to DuckDB storage rows (same pattern as `OtlpConverter`)
1. Persists to DuckDB alongside native OTLP data
1. Returns 200 with empty body (HTTP hooks treat 2xx as success)

This moves 210 lines of client-side bash transformation to ~50 lines of server-side .NET.
The transformation lives where it belongs — in the collector, not in hook scripts.

### Gap 2: Register qyl.mcp in Claude Code settings

**File:** `~/.claude/settings.json`

Add qyl.mcp to `mcpServers`:

```json
{
  "mcpServers": {
    "qyl": {
      "command": "dotnet",
      "args": ["run", "--project", "/Users/ancplua/qyl/src/qyl.mcp"],
      "env": {
        "QYL_COLLECTOR_URL": "http://localhost:5100"
      }
    }
  }
}
```

Add to permissions:

```json
"mcp__qyl"
```

This gives Claude access to all qyl.mcp tools including:

- `qyl.claude_code_sessions` — list sessions
- `qyl.claude_code_timeline` — event timeline
- `qyl.claude_code_tools` — tool usage breakdown
- Plus 30+ other qyl tools (telemetry, copilot, GenAI, analytics, investigate)

### Gap 3: Replace standalone server with HTTP hooks only

**Repo:** ancplua-claude-plugins
**Plugin:** `plugins/claude-self-obs/`

Delete:

- `server/` directory entirely (TypeScript MCP server, node_modules, dist)
- `.mcp.json` (standalone MCP server registration)
- Any remaining bash scripts

Keep:

- `hooks/hooks.json` — update URL to point to qyl.collector
- `commands/status.md` — update to query via qyl.mcp tools
- `README.md` — update architecture description
- `.claude-plugin/plugin.json` — bump version to 3.0.0

Updated `hooks.json`:

```json
{
  "description": "claude-self-obs — POST tool call and agent lifecycle events to qyl.collector",
  "hooks": {
    "PostToolUse": [{
      "hooks": [{
        "type": "http",
        "url": "http://localhost:5100/api/v1/claude-code/hooks",
        "timeout": 2
      }]
    }],
    "SubagentStart": [{
      "hooks": [{
        "type": "http",
        "url": "http://localhost:5100/api/v1/claude-code/hooks",
        "timeout": 2
      }]
    }],
    "SubagentStop": [{
      "hooks": [{
        "type": "http",
        "url": "http://localhost:5100/api/v1/claude-code/hooks",
        "timeout": 2
      }]
    }]
  }
}
```

---

## Architecture after v3

```text
Claude Code session
  │
  │ PostToolUse / SubagentStart / SubagentStop
  │ (type: "http" — native JSON POST, zero scripts)
  │
  ├──────────────────────────────────────────────┐
  │                                              │
  │ HTTP hooks                                   │ Native OTLP (env vars)
  │ (tool inputs, agent lifecycle)               │ (metrics, events, cost, tokens)
  │                                              │
  ▼                                              ▼
qyl.collector (:5100)                     OTel Collector (:4317)
  │ POST /api/v1/claude-code/hooks              │
  │                                              │
  ├──────────────────────────────────────────────┘
  │
  ▼
DuckDB (unified storage)
  │
  │ REST API queries
  │
  ▼
qyl.mcp (STDIO MCP server)
  │ qyl.claude_code_sessions
  │ qyl.claude_code_timeline
  │ qyl.claude_code_tools
  │ + 30 other tools
  │
  ▼
Claude Code reads own telemetry via MCP tools
```

HTTP hooks provide **tool-level detail** (file paths, commands, patterns, agent names).
Native OTLP provides **session-level metrics** (cost, tokens, LOC, prompts).
qyl.collector stores both. qyl.mcp queries both. One platform.

---

## What changes per repo

### ancplua-claude-plugins (this repo)

| Action | Path | Detail |
|--------|------|--------|
| DELETE | `plugins/claude-self-obs/server/` | Standalone TS MCP server |
| DELETE | `plugins/claude-self-obs/.mcp.json` | Standalone MCP registration |
| UPDATE | `plugins/claude-self-obs/hooks/hooks.json` | URL → `:5100/api/v1/claude-code/hooks` |
| UPDATE | `plugins/claude-self-obs/.claude-plugin/plugin.json` | Version 3.0.0, remove MCP references |
| UPDATE | `plugins/claude-self-obs/README.md` | qyl-integrated architecture |
| UPDATE | `plugins/claude-self-obs/commands/status.md` | Query via qyl.mcp tools |
| UPDATE | `CHANGELOG.md` | v3.0.0 entry |

### qyl (separate repo)

| Action | Path | Detail |
|--------|------|--------|
| ADD | `MapClaudeCodeEndpoints()` | `POST /api/v1/claude-code/hooks` endpoint |
| ADD | Hook JSON → storage row converter | Transform hook format to DuckDB rows |

### Settings (one-time)

| Action | File | Detail |
|--------|------|--------|
| ADD | `~/.claude/settings.json` | qyl.mcp in `mcpServers` |
| ADD | `~/.claude/settings.json` | `mcp__qyl` in permissions |

---

## Engineering principles applied

- **#1 Solve problems, not write code:** Delete the standalone server. qyl.mcp already exists.
- **#3 Less code is better code:** 300 lines TS + 58K npm → 40 lines JSON.
- **#9 Fix root causes:** The root cause was no hook ingest endpoint on the collector. Fix that server-side.
- **#25 Easy to use correctly:** HTTP hooks just work. No env vars, no build steps, no processes to manage.

---

## Acceptance criteria

1. Plugin has zero TypeScript/JavaScript code
2. Plugin has zero bash scripts
3. `hooks.json` uses `type: "http"` pointing to qyl.collector
4. No `.mcp.json` in the plugin (qyl.mcp is registered globally)
5. `weave-validate.sh` passes
6. When qyl.collector adds the hooks endpoint, events flow end-to-end
7. Claude can query own telemetry via `qyl.claude_code_*` MCP tools
