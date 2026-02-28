# claude-self-obs

**Watch AI agents build software in real time.**

Every Claude Code tool call (Read, Edit, Bash, Grep, WebSearch, …) becomes an OTLP span.
Agent lifecycle events (spawn, stop) become trace boundaries.
Everything flows to your OTLP collector — zero config, zero code changes.

## How it works

```
Claude Code tool call
  → PostToolUse hook fires
  → emit-span.sh wraps it as OTLP ExportTraceServiceRequest
  → POST to localhost:5100/v1/traces
  → Collector stores + streams to dashboard
```

**Enable:** start your OTLP collector (qyl, Jaeger, any OTLP HTTP endpoint).
**Disable:** stop the collector. Hook silently no-ops — never blocks the agent.

## Signals captured

| Hook | Span name | Key attributes |
|------|-----------|----------------|
| PostToolUse (Read) | `tool/Read` | `file.path` |
| PostToolUse (Edit) | `tool/Edit` | `file.path` |
| PostToolUse (Bash) | `tool/Bash` | `bash.command` |
| PostToolUse (Grep) | `tool/Grep` | `search.pattern` |
| PostToolUse (WebSearch) | `tool/WebSearch` | `search.query` |
| PostToolUse (Task) | `tool/Task` | `task.subagent_type`, `task.prompt` |
| SubagentStart | `agent/start:{name}` | `agent.name`, `agent.type` |
| SubagentStop | `agent/stop:{name}` | `agent.name`, `agent.type`, `agent.id` |

## Trace model

All spans in a session share one `traceId` (derived from `session_id`).
Agent start/stop spans are parent/child pairs.
Tool call spans are flat (no timing yet — `startTime == endTime`).

## Commands

| Command | What it does |
|---------|-------------|
| `/claude-self-obs:status` | Check if collector is reachable |

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `QYL_COLLECTOR_URL` | `http://localhost:5100` | OTLP HTTP endpoint base URL |

## Dependencies

`curl`, `jq`, `python3` — all pre-installed on macOS.
