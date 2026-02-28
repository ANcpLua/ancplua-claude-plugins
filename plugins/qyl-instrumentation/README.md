# qyl-instrumentation

Teams API observability orchestration for qyl's compile-time OTel instrumentation system.

## Architecture

```text
/qyl-instrumentation:observe [task]
        │
        v
  captain (Opus) ── pre-reads otelwiki bundled semconv docs
        │              assembles SEMCONV_CONTEXT + SHARED_AWARENESS
        │
        ├── servicedefaults (Sonnet) ── compile-time attributes, generators
        ├── collector (Sonnet) ──────── OTLP ingestion, DuckDB, API, TypeSpec
        ├── genai (Sonnet) ──────────── GenAI semconv, agent/LLM tracing
        └── platform (Sonnet) ───────── MCP server, dashboard, browser SDK
              │                │               │                │
              └────────────────┴───────────────┴────────────────┘
                          cross-pollinate via SendMessage
```

## Key Innovation

**Zero runtime web search.** The Opus captain pre-reads otelwiki's bundled semantic
convention docs BEFORE spawning specialists. Each Sonnet specialist receives
pre-assembled semconv context in their spawn prompt — they never need to web search
or web fetch.

This means:

- Specialists work with VERIFIED, CURRENT attribute data (from otelwiki's synced docs)
- No runtime latency from web searches
- No hallucinated attribute names from stale training data
- Captain verifies doc freshness — warns if otelwiki needs sync

## What This Plugin Provides

### Command

| Command | Purpose |
|---------|---------|
| `/qyl-instrumentation:observe` | Full team orchestration — context assembly, spawn, coordinate, synthesize |

### Agents

| Agent | subagent_type | Model | Domain |
|-------|---------------|-------|--------|
| Opus Captain | `opus-captain` | Opus 4.6 | Orchestration, context assembly |
| ServiceDefaults Specialist | `servicedefaults-specialist` | Sonnet 4.6 | Source generator, attribute vocabulary, interceptor pipelines |
| qyl Observability Specialist | `qyl-observability-specialist` | Sonnet 4.6 | OTLP ingestion, DuckDB, collector architecture, TypeSpec schemas |
| OTel GenAI Architect | `otel-genai-architect` | Sonnet 4.6 | GenAI semantic conventions, agent tracing, LLM telemetry |
| qyl Platform Specialist | `qyl-platform-specialist` | Sonnet 4.6 | MCP server, dashboard, browser SDK, SSE streaming |

## Usage

Full team orchestration:

```text
/qyl-instrumentation:observe Add tracing to the new OrderService with GenAI telemetry
/qyl-instrumentation:observe Design DuckDB schema for agent invocation metrics
/qyl-instrumentation:observe Instrument the MCP server with request/response tracing
```

Individual specialist (bypasses team, no pre-fetched context):

```text
Task(subagent_type="qyl-instrumentation:servicedefaults-specialist", prompt="Add [Traced] to PaymentService")
Task(subagent_type="qyl-instrumentation:otel-genai-architect", prompt="Validate GenAI attributes against semconv")
```

## Shared Awareness

All agents are aware of:

- **AI monitoring use cases:** silent failures, malformed responses, performance
  bottlenecks, agent loops, cost attribution, context overflow, tool failures,
  safety violations
- **Quality criteria:** accuracy (20-25%), reasoning (20-25%), creativity (15%),
  UX (15%), reliability/safety (20%)
- **Enterprise integration:** External MCP (8pts), Connected Agents Architecture
  (15pts), OAuth (5pts), Adaptive Cards (5pts)

## Dependencies

- **otelwiki plugin** — captain reads bundled docs for semconv context (graceful degradation if missing)
- **ancplua-project-routing** — detects qyl workspace and injects agent types into session
