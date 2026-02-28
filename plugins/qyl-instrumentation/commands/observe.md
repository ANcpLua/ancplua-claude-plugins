---
description: >-
  Observability team: Opus captain pre-reads otelwiki semconv docs, then dispatches
  4 Sonnet specialists via Teams API. Zero runtime web search — all context pre-assembled.
argument-hint: [task description]
---

# /qyl-instrumentation:observe [task]

Invoke the qyl observability team on `[task]`.

## When to use

- Instrumenting services with `[Traced]`, `[OTel]`, `[AgentTraced]`
- Modifying source generator pipelines (analyzers, emitters)
- Adding GenAI telemetry (LLM calls, agent invocations, tool calls)
- Designing collector storage schemas or API endpoints
- Building dashboard components or MCP query handlers
- Cross-cutting observability work touching multiple qyl projects

## Architecture

```text
captain (lead, Opus) — pre-reads otelwiki bundled docs → assembles SEMCONV_CONTEXT
  │
  ├── servicedefaults (Sonnet) ── compile-time instrumentation, attributes, generators
  ├── collector (Sonnet) ──────── OTLP ingestion, DuckDB storage, API, TypeSpec
  ├── genai (Sonnet) ──────────── GenAI semconv, agent/LLM tracing
  └── platform (Sonnet) ───────── MCP server, dashboard, browser SDK, SSE
        │                │               │                │
        └────────────────┴───────────────┴────────────────┘
                    cross-pollinate via SendMessage
```

## Orchestration

### STEP 0 — CONTEXT ASSEMBLY (captain does this FIRST)

Pre-read otelwiki bundled docs. These are sibling to this plugin:

```text
1. Glob: **/otelwiki/docs/VERSION.md
   → Read it. If >30 days stale: WARN user "run /otelwiki:sync first" and HALT.

2. Read these files (Glob for them under otelwiki/docs/):
   - semantic-conventions/gen-ai/gen-ai-spans.md       → GenAI trace attributes
   - semantic-conventions/gen-ai/gen-ai-metrics.md     → GenAI metric instruments
   - semantic-conventions/gen-ai/gen-ai-events.md      → GenAI log events
   - semantic-conventions/gen-ai/gen-ai-agent-spans.md  → Agent invocation spans
   - semantic-conventions/database/database-spans.md   → Database trace attributes
   - semantic-conventions/dotnet/README.md             → .NET-specific conventions
   - instrumentation/traces-api.md                     → .NET tracing API
   - instrumentation/metrics-api.md                    → .NET metrics API

3. Assemble SEMCONV_CONTEXT: extract attribute tables, metric instruments,
   event names — compact form, just the data specialists need.

4. If otelwiki docs missing entirely:
   WARN user: "otelwiki plugin not installed — specialists will use built-in knowledge only"
   Proceed (agents have baseline knowledge in their definitions).
```

### STEP 1 — TeamCreate

```text
TeamCreate: team_name = "qyl-observe", description = "qyl observability: [task summary]"
```

### STEP 2 — Create tasks from user request

Break `[task]` into specialist-appropriate work items:

```text
TaskCreate for each distinct piece of work.
Assign tasks to specialists by setting owner after spawn.
```

### STEP 3 — Spawn 4 specialists (ALL in ONE message, parallel)

Each specialist gets SEMCONV_CONTEXT + SHARED_AWARENESS injected in their spawn prompt:

```text
Task: team_name="qyl-observe", name="servicedefaults",
      subagent_type="qyl-instrumentation:servicedefaults-specialist", model="sonnet"
      prompt: "[task decomposition]\n\n## SEMCONV CONTEXT\n[SEMCONV_CONTEXT]\n\n## SHARED AWARENESS\n[SHARED_AWARENESS]"

Task: team_name="qyl-observe", name="collector",
      subagent_type="qyl-instrumentation:qyl-observability-specialist", model="sonnet"
      prompt: "[task decomposition]\n\n## SEMCONV CONTEXT\n[SEMCONV_CONTEXT]\n\n## SHARED AWARENESS\n[SHARED_AWARENESS]"

Task: team_name="qyl-observe", name="genai",
      subagent_type="qyl-instrumentation:otel-genai-architect", model="sonnet"
      prompt: "[task decomposition]\n\n## SEMCONV CONTEXT\n[SEMCONV_CONTEXT]\n\n## SHARED AWARENESS\n[SHARED_AWARENESS]"

Task: team_name="qyl-observe", name="platform",
      subagent_type="qyl-instrumentation:qyl-platform-specialist", model="sonnet"
      prompt: "[task decomposition]\n\n## SEMCONV CONTEXT\n[SEMCONV_CONTEXT]\n\n## SHARED AWARENESS\n[SHARED_AWARENESS]"
```

### STEP 4 — Cross-pollination

Specialists debate via `SendMessage`:

- servicedefaults + genai: "This attribute name matches semconv?" / "Use `[OTel]` not `[TracedTag]` for standard names"
- collector + platform: "DuckDB column for new metric?" / "Dashboard needs this query shape"
- Captain reads messages, creates follow-up tasks if needed

### STEP 5 — Convergence

When all specialists go idle with no new messages:

- Review TaskList for completed/incomplete work
- If gaps: send focused follow-up messages to specific specialists
- If complete: proceed to synthesis

### STEP 6 — Captain synthesis

Review all team messages and task results:

- Verify cross-cutting consistency (attribute names match across generator + storage + dashboard)
- Verify semconv compliance (all names match SEMCONV_CONTEXT)
- Compile final report: files modified, conventions applied, build verification

### STEP 7 — Shutdown + cleanup

```text
SendMessage: type="shutdown_request" to servicedefaults, collector, genai, platform
Wait for all shutdown_response messages.
TeamDelete
```

## SHARED_AWARENESS block

Inject this into every specialist's spawn prompt:

```text
## AI Agent Monitoring (instrument for these failure modes)
- Silent failures: LLM returns empty/null without error — users see nothing
- Malformed responses: JSON parse failures, schema violations, truncated output
- Performance bottlenecks: P95 tail latency, token generation latency, queue depth
- Agent loops: repeated tool calls with same args, no progress
- Cost attribution: tokens per model, per agent, per user session
- Context overflow: input tokens approaching model limits, silent truncation
- Tool failures: MCP invocations returning errors or timeouts
- Safety violations: content filter triggers (log without exposing filtered content)

## Quality Criteria (optimize instrumentation for)
- Accuracy (20-25%): validate responses, trace fact-checking pipelines
- Reasoning (20-25%): log intermediate steps, chain-of-thought traces
- Creativity (15%): measure solution diversity, track novel approaches
- UX (15%): dashboard latency, SSE quality, error presentation
- Reliability/Safety (20%): circuit breakers, fallback traces, safety telemetry
- Enterprise: MCP tool invocations (8pts), inter-agent spans (15pts), auth flows (5pts)
```

## Example Run

**Input:** "Add cost tracking to GenAI spans"

**STEP 0 — Captain reads otelwiki:**

Captain finds `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens`
in semconv but no `gen_ai.cost` — cost is a qyl extension, not semconv.

**STEP 3 — Decomposition to 4 specialists:**

| Specialist | Task |
|------------|------|
| genai | Compute `gen_ai_cost_usd` from tokens × model price |
| servicedefaults | Add `[TracedReturn("gen_ai_cost_usd")]` to capture cost |
| collector | Add `gen_ai_cost_usd` column via TypeSpec |
| platform | Dashboard cost column, MCP cost query tool |

**STEP 4 — Cross-pollination messages:**

- genai → servicedefaults: "Cost is computed, not an LLM attribute —
  use `[TracedReturn]` not `[OTel]`"
- collector → platform: "New `gen_ai_cost_usd` column is `float64`,
  nullable. Query: `sum(gen_ai_cost_usd) WHERE service_name = ?`"

**STEP 6 — Captain synthesis:**

```text
Files modified: 6
  core/specs/spans.tsp         (TypeSpec + cost field)
  SpanStorageRow.g.cs          (generated, not hand-edited)
  GenAiInstrumentation.cs      (cost computation logic)
  AgentTools.cs                (MCP cost query tool)
  use-telemetry.ts             (dashboard hook)
  CostColumn.tsx               (new dashboard component)

Convention: gen_ai_cost_usd (qyl extension, not semconv)
Build: nuke Full — passed
```

## Synthesis Verification Checklist

Before captain reports task complete:

- [ ] Tag names consistent across generator, storage, dashboard
- [ ] Semconv names match SEMCONV_CONTEXT (no invented names)
- [ ] TypeSpec updated if new storage columns added
- [ ] MCP tools return new data in markdown tables
- [ ] SSE events include new fields in JSON payload
- [ ] `nuke Full` passes (compile + test + codegen + verify)

## Cost profile

| Agent | Model | Cost |
|-------|-------|------|
| captain (lead) | Opus 4.6 | High (context assembly + coordination + synthesis) |
| servicedefaults | Sonnet 4.6 | Medium |
| collector | Sonnet 4.6 | Medium |
| genai | Sonnet 4.6 | Medium |
| platform | Sonnet 4.6 | Medium |

Total: ~3-4x a single Opus pass.

## When NOT to use

- Simple attribute addition on one file → spawn the specialist agent directly
- Reading OTel docs → use `otelwiki:otel-guide`
- P0 bug → use `/exodia:turbo-fix`
- Cleanup → use `/exodia:hades`
