---
description: Orchestrate qyl observability team — 1 Opus captain + 4 Sonnet specialists in parallel
argument-hint: [observability task]
effort: high
---

# /qyl:observe [task]

Orchestrate the qyl observability team on `[task]`.

## Step 1 — Captain Pre-Reads otelwiki Docs

Before spawning anyone, assemble SEMCONV_CONTEXT:

```text
1. Glob for **/otelwiki/**/docs/**/*.md
2. Read key files:
   - semantic-conventions/gen-ai/gen-ai-spans.md
   - semantic-conventions/gen-ai/gen-ai-metrics.md
   - semantic-conventions/gen-ai/gen-ai-events.md
   - semantic-conventions/gen-ai/gen-ai-agent-spans.md
   - semantic-conventions/database/database-spans.md
   - semantic-conventions/dotnet/README.md
   - instrumentation/traces-api.md
   - instrumentation/metrics-api.md
3. Extract attribute tables, metric instruments, event names into SEMCONV_CONTEXT.
4. If otelwiki missing: warn user, proceed with built-in knowledge.
```

## Step 2 — TeamCreate + Spawn 4 Specialists (ONE message)

```text
TeamCreate: team_name="qyl-observe", description="qyl observability: [task summary]"
```

Spawn all 4 in ONE message. Each gets SEMCONV_CONTEXT + conventions below in their prompt.

### generators specialist

```text
Scope: qyl.instrumentation.generators, qyl.collector.storage.generators
Focus: IIncrementalGenerator pipelines, ForAttributeWithMetadataName,
       value-equatable models, raw strings (never SyntaxFactory).
       Compile-time [Traced]/[OTel] attribute emission, DuckDB mapper codegen.
```

### collector specialist

```text
Scope: qyl.collector
Focus: OTLP ingest (gRPC + HTTP), DuckDB 1.5.0 storage (columnar, glibc),
       REST API endpoints, SSE streaming, TypeSpec schema updates.
       MAF hosted pattern: AddAIAgent() + WithOpenTelemetry().
```

### genai architect

```text
Scope: Cross-cutting GenAI observability design
Focus: OTel GenAI Semantic Conventions 1.40 compliance.
       MAF OpenTelemetryAgent middleware, invoke_agent/chat/execute_tool spans.
       Agent loop detection, cost attribution, token tracking.
       Pattern: AsAIAgent() standalone OR AddAIAgent() hosted.
```

### dashboard/platform specialist

```text
Scope: qyl.dashboard, qyl.mcp
Focus: React 19, Base UI 1.3.0 (NEVER shadcn/Radix), lucide-react,
       TanStack Table/Query, ECharts 6, Tailwind CSS 4, Vite 7.
       MCP server tools, SSE consumption, dashboard visualization.
```

### Conventions block (inject into every specialist prompt)

```text
RUNTIME:    .NET 10.0 LTS, C# 14
OTEL:       SDK 1.15.0, Semconv 1.40 (different version tracks)
DATABASE:   DuckDB 1.5.0 (glibc required, Debian not Alpine)
FRONTEND:   React 19, Vite 7, Tailwind 4, Base UI 1.3.0, lucide-react
MAF:        AddAIAgent() hosted OR AsAIAgent() standalone
BANNED:     DateTime.Now, Newtonsoft.Json, ISourceGenerator, SyntaxFactory,
            Radix UI, Phosphor, #pragma warning disable, [SuppressMessage]
CHANGELOG:  Read before starting, update before finishing — shared brain.

Real projects ONLY: qyl.collector, qyl.contracts, qyl.instrumentation,
  qyl.instrumentation.generators, qyl.collector.storage.generators,
  qyl.loom, qyl.mcp, qyl.dashboard
```

## Step 3 — Captain Coordinates and Synthesizes

```text
1. Specialists cross-pollinate via SendMessage:
   - generators + genai: attribute names match semconv?
   - collector + dashboard: new DuckDB column shape matches query needs?
2. Captain monitors messages, creates follow-up tasks if gaps found.
3. When all idle: verify cross-cutting consistency (names match across
   generator output, storage schema, dashboard queries).
4. Verify semconv compliance against SEMCONV_CONTEXT.
5. Final: nuke Full passes, CHANGELOG.md updated, report to user.
```

## When NOT to use

- Single-file attribute change -- spawn the specialist directly
- Reading OTel docs -- `/otelwiki:otel-expert`
- P0 bug -- `/exodia:turbo-fix`
- Cleanup -- `/exodia:hades`
