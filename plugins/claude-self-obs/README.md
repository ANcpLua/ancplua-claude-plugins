# claude-self-obs

**Claude Code observes itself — through qyl.**

Every tool call, agent spawn, and agent stop becomes a queryable event in qyl's DuckDB.
Claude queries its own telemetry via qyl.mcp tools.

## Architecture

```text
Claude Code session
  │
  │ PostToolUse / SubagentStart / SubagentStop
  │ (type: "http" — native JSON POST, zero scripts)
  │
  ▼
qyl.collector (:5100)
  │ POST /api/v1/claude-code/hooks
  │ → transforms to DuckDB rows
  │ → persists alongside native OTLP data
  │
  ▼
qyl.mcp (STDIO MCP server)
  │ qyl.claude_code_sessions
  │ qyl.claude_code_timeline
  │ qyl.claude_code_tools
  │
  ▼
Claude reads own telemetry
```

## How it works

1. **HTTP hooks** fire on every tool call and agent lifecycle event
2. Claude Code POSTs the raw event JSON to qyl.collector
3. qyl.collector transforms and stores in DuckDB
4. Claude queries via qyl.mcp tools (registered globally)

No bash scripts. No standalone server. No npm dependencies.
The plugin is just `hooks.json` — 38 lines of declarative JSON.

## Events captured

| Hook | Event type | Key fields |
|------|-----------|------------|
| PostToolUse | Tool call | `tool_name`, `tool_input` (file_path, command, pattern, etc.) |
| SubagentStart | Agent spawn | `agent_name`, `agent_type` |
| SubagentStop | Agent finish | `agent_name`, `agent_type`, `agent_id` |

## Query tools (via qyl.mcp)

| Tool | Purpose |
|------|---------|
| `qyl.claude_code_sessions` | List sessions with usage stats |
| `qyl.claude_code_timeline` | Event timeline grouped by prompt |
| `qyl.claude_code_tools` | Tool call counts, success rates |

## Setup

1. **qyl.collector** must be running on `:5100`
1. **qyl.mcp** must be registered in `~/.claude/settings.json`:

   ```json
   {
     "mcpServers": {
       "qyl": {
         "command": "dotnet",
         "args": ["run", "--project", "/path/to/qyl/src/qyl.mcp"],
         "env": { "QYL_COLLECTOR_URL": "http://localhost:5100" }
       }
     }
   }
   ```

1. For native OTLP metrics (optional, complementary):

   ```bash
   export CLAUDE_CODE_ENABLE_TELEMETRY=1
   export OTEL_METRICS_EXPORTER=otlp
   export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
   ```

## Relationship to native OTLP (spec-0002)

| Source | What it provides | Where it goes |
|--------|-----------------|---------------|
| Native OTLP (env vars) | Metrics (tokens, cost, LOC) + events | OTel Collector → qyl |
| HTTP hooks (this plugin) | Tool inputs, agent lifecycle | qyl.collector → DuckDB |

Native OTLP gives you the *what* (counters, costs). Hooks give you the *how* (file paths, commands, patterns).
