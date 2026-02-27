# spec-0002: qyl Claude Code Observability

**Status:** Draft
**Author:** Alexander + Claude Opus 4.6
**Date:** 2026-02-27
**Target repo:** `qyl` (not ancplua-claude-plugins)

---

## 1. Problem

Claude Code sessions are opaque to the human operator. There is no real-time visibility into what Claude is doing, what tools it called, how many tokens it consumed, or whether it's stuck. The operator only sees the terminal output scrolling by.

We attempted to solve this with a `type: "prompt"` hook on the Stop event using haiku as a session observer. This failed because:

- Stop hooks only accept `{decision, reason}` JSON — no `additionalContext`, no `systemMessage`
- Async prompt hooks discard output entirely
- The hook system has no mechanism for "human-visible only, Claude-invisible" output

The solution is not a hook. Claude Code already emits OTLP telemetry natively. qyl already ingests OTLP. The session observer is a qyl dashboard feature, not a Claude Code plugin feature.

---

## 2. Solution

Connect Claude Code's native OTLP export to qyl's ingest endpoint. Build a Claude Code session view in qyl's dashboard using existing patterns (same as Copilot integration and agent insights).

### Architecture

```
Claude Code (terminal)
  │
  │ OTLP/gRPC (metrics + events/logs)
  │ service.name: "claude-code"
  │ meter.name: "com.anthropic.claude_code"
  │
  ▼
OTel Collector (localhost:4317)
  │
  │ OTLP
  │
  ▼
qyl ingest → DuckDB
  │
  │ API queries
  │
  ▼
qyl dashboard (browser)
  └── Claude Code session view (auto-refreshing)
```

Claude Code has **zero awareness** of the observation. The OTLP export happens at the runtime level. No hooks, no scripts, no injected context.

---

## 3. What Claude Code Emits (Native, Zero Config Beyond Env Vars)

### 3.1 Environment Variables (operator sets once)

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_METRIC_EXPORT_INTERVAL=10000
export OTEL_METRICS_INCLUDE_SESSION_ID=true
export OTEL_METRICS_INCLUDE_ACCOUNT_UUID=true
export OTEL_METRICS_INCLUDE_VERSION=true
```

### 3.2 Resource Attributes (auto-emitted)

```yaml
service.name: "claude-code"
service.version: "<Claude Code version>"
os.type: "darwin"
host.arch: "arm64"
meter.name: "com.anthropic.claude_code"
session.id: "<uuid>"
user.account_uuid: "<uuid>"
organization.id: "<uuid>"
terminal.type: "iTerm.app" | "vscode" | "cursor" | "tmux"
```

### 3.3 Metrics (counters, auto-emitted)

| Metric | Unit | Type | Key Attributes |
|--------|------|------|----------------|
| `claude_code.session.count` | count | Counter | standard attrs |
| `claude_code.lines_of_code.count` | count | Counter | `type`: added/removed |
| `claude_code.pull_request.count` | count | Counter | standard attrs |
| `claude_code.commit.count` | count | Counter | standard attrs |
| `claude_code.cost.usage` | USD | Counter | `model` |
| `claude_code.token.usage` | tokens | Counter | `type`: input/output/cacheRead/cacheCreation, `model` |
| `claude_code.code_edit_tool.decision` | count | Counter | `tool`, `decision`, `language` |
| `claude_code.active_time.total` | s | Counter | standard attrs |

### 3.4 Events (via OTEL_LOGS_EXPORTER=otlp)

All events share `prompt.id` (uuid v4) as the correlation key.

**`claude_code.user_prompt`**

```yaml
event.name: "user_prompt"
prompt.id: "<uuid>"
prompt_length: <int>
prompt: "<content>"           # only if OTEL_LOG_USER_PROMPTS=1
```

**`claude_code.api_request`**

```yaml
event.name: "api_request"
prompt.id: "<uuid>"
model: "claude-sonnet-4-5-20250929"
cost_usd: <float>
duration_ms: <int>
input_tokens: <int>
output_tokens: <int>
cache_read_tokens: <int>
cache_creation_tokens: <int>
```

**`claude_code.api_error`**

```yaml
event.name: "api_error"
prompt.id: "<uuid>"
model: "<model>"
error: "<message>"
status_code: "<http status>"
duration_ms: <int>
attempt: <int>
```

**`claude_code.tool_result`**

```yaml
event.name: "tool_result"
prompt.id: "<uuid>"
tool_name: "Bash" | "Read" | "Edit" | "Write" | "Glob" | "Grep" | "<mcp tool>"
success: "true" | "false"
duration_ms: <int>
error: "<message>"
decision: "accept" | "reject"
source: "config" | "user_permanent" | "user_temporary" | "user_abort" | "user_reject"
tool_parameters: "<json string>"
```

**`claude_code.tool_decision`**

```yaml
event.name: "tool_decision"
prompt.id: "<uuid>"
tool_name: "<tool>"
decision: "accept" | "reject"
source: "config" | "user_permanent" | "user_temporary" | "user_abort" | "user_reject"
```

### 3.5 What Claude Code Does NOT Emit

- **No traces/spans.** Only metrics and events/logs.
- **No file contents or code snippets.** Tool parameters include command text for Bash but not file content for Read/Write.
- **No prompt content by default.** Only with `OTEL_LOG_USER_PROMPTS=1`.

---

## 4. qyl Changes Required

### 4.1 Backend: DuckDB Ingest

Claude Code events arrive as OTLP logs. qyl's existing OTLP ingest pipeline writes them to DuckDB. The events table schema must accommodate Claude Code's event attributes.

**Target table: `events`** (extend existing or create claude_code_events)

```sql
-- Events land via OTLP logs ingest
-- Key columns to extract from OTLP log record attributes:
--   event.name       → event_name
--   prompt.id        → prompt_id (correlation key)
--   session.id       → session_id (from resource attributes)
--   tool_name        → tool_name
--   model            → model
--   cost_usd         → cost_usd
--   duration_ms      → duration_ms
--   input_tokens     → input_tokens
--   output_tokens    → output_tokens
--   success          → success
--   decision         → decision
--   error            → error
```

**Metrics land via OTLP metrics ingest** into the existing metrics table. Key metric names to recognize:

```
claude_code.session.count
claude_code.token.usage
claude_code.cost.usage
claude_code.lines_of_code.count
claude_code.commit.count
claude_code.pull_request.count
claude_code.code_edit_tool.decision
claude_code.active_time.total
```

### 4.2 Backend: API Endpoints

Create API endpoints following existing patterns from `use-agent-insights.ts`:

**`GET /api/v1/claude-code/sessions`**

Returns list of Claude Code sessions, grouped by `session.id`.

```typescript
interface ClaudeCodeSession {
    sessionId: string;
    startTime: string;           // ISO 8601
    lastActivityTime: string;    // ISO 8601
    totalPrompts: number;        // count of user_prompt events
    totalApiCalls: number;       // count of api_request events
    totalToolCalls: number;      // count of tool_result events
    totalCostUsd: number;        // sum of cost_usd from api_request
    totalInputTokens: number;
    totalOutputTokens: number;
    models: string[];            // distinct models used
    terminalType: string;        // from resource attrs
    claudeCodeVersion: string;   // from resource attrs
}
```

DuckDB query:

```sql
SELECT
    session_id,
    MIN(event_timestamp) AS start_time,
    MAX(event_timestamp) AS last_activity_time,
    COUNT(*) FILTER (WHERE event_name = 'user_prompt') AS total_prompts,
    COUNT(*) FILTER (WHERE event_name = 'api_request') AS total_api_calls,
    COUNT(*) FILTER (WHERE event_name = 'tool_result') AS total_tool_calls,
    SUM(cost_usd) FILTER (WHERE event_name = 'api_request') AS total_cost_usd,
    SUM(input_tokens) FILTER (WHERE event_name = 'api_request') AS total_input_tokens,
    SUM(output_tokens) FILTER (WHERE event_name = 'api_request') AS total_output_tokens,
    LIST(DISTINCT model) FILTER (WHERE model IS NOT NULL) AS models
FROM claude_code_events
WHERE service_name = 'claude-code'
GROUP BY session_id
ORDER BY last_activity_time DESC
LIMIT 50;
```

**`GET /api/v1/claude-code/sessions/:sessionId/timeline`**

Returns all events for a session, ordered by timestamp. This is the prompt lifecycle view.

```typescript
interface ClaudeCodeEvent {
    eventName: string;          // user_prompt, api_request, tool_result, etc.
    promptId: string;           // correlation key
    timestamp: string;          // ISO 8601
    toolName?: string;
    model?: string;
    costUsd?: number;
    durationMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    success?: boolean;
    decision?: string;
    error?: string;
    promptLength?: number;
}
```

DuckDB query:

```sql
SELECT
    event_name,
    prompt_id,
    event_timestamp,
    tool_name,
    model,
    cost_usd,
    duration_ms,
    input_tokens,
    output_tokens,
    success,
    decision,
    error,
    prompt_length
FROM claude_code_events
WHERE session_id = $1
ORDER BY event_timestamp ASC;
```

**`GET /api/v1/claude-code/sessions/:sessionId/tools`**

Returns tool usage summary for a session.

```typescript
interface ClaudeCodeToolSummary {
    toolName: string;
    callCount: number;
    successCount: number;
    failureCount: number;
    avgDurationMs: number;
    acceptCount: number;
    rejectCount: number;
}
```

**`GET /api/v1/claude-code/sessions/:sessionId/cost`**

Returns cost breakdown by model for a session.

```typescript
interface ClaudeCodeCostBreakdown {
    model: string;
    apiCalls: number;
    totalCostUsd: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
}
```

**`GET /api/v1/claude-code/live`** (SSE endpoint)

Real-time event stream filtered to `service.name = 'claude-code'`. Same pattern as existing `/api/v1/live` but pre-filtered.

```
event: connected
data: {"connectionId": "..."}

event: claude-code-event
data: {"eventName": "tool_result", "promptId": "...", "toolName": "Edit", ...}
```

### 4.3 Frontend: React Hook

**File: `src/hooks/use-claude-code.ts`**

Follow existing patterns from `use-agent-insights.ts` and `use-telemetry.ts`.

```typescript
// Query keys
export const claudeCodeKeys = {
    all: ['claude-code'] as const,
    sessions: () => [...claudeCodeKeys.all, 'sessions'] as const,
    session: (id: string) => [...claudeCodeKeys.all, 'session', id] as const,
    timeline: (id: string) => [...claudeCodeKeys.all, 'timeline', id] as const,
    tools: (id: string) => [...claudeCodeKeys.all, 'tools', id] as const,
    cost: (id: string) => [...claudeCodeKeys.all, 'cost', id] as const,
};

// Hooks
export function useClaudeCodeSessions()
    → useQuery → GET /api/v1/claude-code/sessions
    → refetchInterval: 10_000 (live update)

export function useClaudeCodeTimeline(sessionId: string)
    → useQuery → GET /api/v1/claude-code/sessions/:id/timeline
    → refetchInterval: 5_000 (live update during active session)

export function useClaudeCodeTools(sessionId: string)
    → useQuery → GET /api/v1/claude-code/sessions/:id/tools

export function useClaudeCodeCost(sessionId: string)
    → useQuery → GET /api/v1/claude-code/sessions/:id/cost

export function useClaudeCodeLiveStream(sessionId?: string)
    → SSE → GET /api/v1/claude-code/live?session=:id
    → same pattern as useLiveStream from use-telemetry.ts
    → auto-invalidates session queries on new events
```

**File: `src/hooks/index.ts`** — add `export * from './use-claude-code';`

### 4.4 Frontend: Dashboard Components

**File: `src/components/claude-code/ClaudeCodeSessionList.tsx`**

Session list view. Shows all Claude Code sessions with summary stats (prompts, tools, cost, duration). Click to drill into timeline.

| Column | Source |
|--------|--------|
| Session ID (truncated) | `session.id` |
| Started | `MIN(event_timestamp)` |
| Duration | `MAX - MIN` |
| Prompts | count of `user_prompt` events |
| Tool Calls | count of `tool_result` events |
| Cost | sum of `cost_usd` |
| Tokens | sum of input + output |
| Models | distinct model list |

**File: `src/components/claude-code/ClaudeCodeTimeline.tsx`**

Session timeline view. The core component. Shows events as a vertical timeline grouped by `prompt.id`.

```
┌─────────────────────────────────────────────────────┐
│ Session abc-123 · 45min · $0.82 · 23 prompts        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ▶ Prompt #1 "Fix the auth bug"          14:23:01    │
│   ├── api_request  claude-opus-4  $0.04   1.2s      │
│   ├── tool_result  Read auth.ts   ✓       0.1s      │
│   ├── tool_result  Edit auth.ts   ✓       0.2s      │
│   ├── api_request  claude-opus-4  $0.03   0.8s      │
│   └── tool_result  Bash "npm test" ✓     3.4s       │
│                                                     │
│ ▶ Prompt #2 "Now add tests"             14:24:12    │
│   ├── api_request  claude-opus-4  $0.05   1.5s      │
│   ├── tool_result  Write test.ts  ✓       0.1s      │
│   ├── tool_result  Bash "npm test" ✗     2.1s       │
│   │   └── error: "1 test failed"                    │
│   ├── api_request  claude-opus-4  $0.03   0.9s      │
│   ├── tool_result  Edit test.ts   ✓       0.1s      │
│   └── tool_result  Bash "npm test" ✓     2.0s       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Each prompt group is collapsible. Events within a prompt are ordered by timestamp. Color coding:

- `user_prompt` → blue (prompt boundary)
- `api_request` → purple (LLM call, shows model + cost + tokens)
- `tool_result` success → green
- `tool_result` failure → red
- `api_error` → red with retry count
- `tool_decision` reject → orange

Reuse existing components:

- `StatusDot` from `AgentTraceTree.tsx` (running/completed/failed indicators)
- `TextVisualizer` for expanding tool parameters
- `Badge` for model names, tool types
- `formatDuration` from `use-telemetry.ts`
- Timeline bar pattern from `ToolCallNode` in `AgentTraceTree.tsx`

**File: `src/components/claude-code/ClaudeCodeToolBreakdown.tsx`**

Tool usage breakdown for a session. Bar chart or table showing call count, success rate, avg duration per tool. Same pattern as `useAgentTools` response rendering.

**File: `src/components/claude-code/ClaudeCodeCostPanel.tsx`**

Cost breakdown by model. Pie chart or table. Shows input/output/cache token split.

**File: `src/components/claude-code/index.ts`**

```typescript
export { ClaudeCodeSessionList } from './ClaudeCodeSessionList';
export { ClaudeCodeTimeline } from './ClaudeCodeTimeline';
export { ClaudeCodeToolBreakdown } from './ClaudeCodeToolBreakdown';
export { ClaudeCodeCostPanel } from './ClaudeCodeCostPanel';
```

### 4.5 Frontend: Routing

Add a route for the Claude Code view. Follow existing routing patterns:

```
/claude-code                  → ClaudeCodeSessionList
/claude-code/:sessionId       → ClaudeCodeTimeline + tools + cost panels
```

### 4.6 Frontend: Navigation

Add "Claude Code" entry to the sidebar/navigation. Icon suggestion: `Terminal` from lucide-react (already imported in AgentTraceTree).

---

## 5. Correlation Key: prompt.id

This is the most important concept. Every event within a single user prompt shares the same `prompt.id`. This allows reconstructing the full lifecycle:

```
prompt.id = "abc-123"
  → user_prompt (the question)
  → api_request (LLM thinks)
  → tool_result (Read a file)
  → tool_result (Edit a file)
  → api_request (LLM thinks again)
  → tool_result (Run tests)
```

The timeline component groups events by `prompt.id` and renders each group as a collapsible section.

`prompt.id` is HIGH cardinality — never use it in metrics. Events/logs only.

---

## 6. Live Update Strategy

Two approaches, both proven in qyl:

**Approach A: Polling (simple)**

`useClaudeCodeTimeline` with `refetchInterval: 5000`. Every 5 seconds, re-query the full timeline. Simple, works, slightly wasteful.

**Approach B: SSE (real-time)**

`useClaudeCodeLiveStream` opens an SSE connection to `/api/v1/claude-code/live`. New events push instantly. On each event, invalidate the relevant React Query cache. Same pattern as `useLiveStream` in `use-telemetry.ts`.

**Recommendation:** Start with Approach A. Upgrade to B if latency matters.

---

## 7. What This Does NOT Cover

- **Traces/spans from Claude Code.** Claude Code does not emit traces. If Anthropic adds trace support later, extend this spec.
- **Modifying Claude Code's behavior.** This is read-only observation. No hooks, no injected context, no behavior changes.
- **Cross-session analytics.** This spec covers per-session views. Aggregate analytics (cost trends over time, tool usage patterns across sessions) is a separate feature that builds on the same data.
- **Prompt content display.** `OTEL_LOG_USER_PROMPTS=1` enables prompt content in events. The dashboard should render it if present but not require it.

---

## 8. Implementation Order

### Phase 1: Plumbing (get data flowing)

1. Set env vars on Alexander's machine (4 lines in shell profile)
2. Verify Claude Code events arrive in qyl's DuckDB (manual SQL query)
3. Verify metrics arrive (check metrics table for `claude_code.*`)

### Phase 2: API (query the data)

4. Create `/api/v1/claude-code/sessions` endpoint
5. Create `/api/v1/claude-code/sessions/:id/timeline` endpoint
6. Create `/api/v1/claude-code/sessions/:id/tools` endpoint
7. Create `/api/v1/claude-code/sessions/:id/cost` endpoint

### Phase 3: Dashboard (show the data)

8. Create `use-claude-code.ts` hook
9. Create `ClaudeCodeSessionList.tsx`
10. Create `ClaudeCodeTimeline.tsx` (the core component)
11. Create `ClaudeCodeToolBreakdown.tsx`
12. Create `ClaudeCodeCostPanel.tsx`
13. Add routing and navigation

### Phase 4: Live (optional)

14. Create `/api/v1/claude-code/live` SSE endpoint
15. Create `useClaudeCodeLiveStream` hook
16. Wire live updates into timeline component

---

## 9. Existing Code to Reuse

| qyl Component | Reuse For |
|----------------|-----------|
| `use-agent-insights.ts` pattern | Query key structure, `TimeFilter`, `fetchJson` |
| `use-agent-runs.ts` types | `AgentRun` → maps to `ClaudeCodeSession`, `ToolCall` → maps to `ClaudeCodeEvent` |
| `use-telemetry.ts` `useLiveStream` | SSE pattern for live updates |
| `AgentTraceTree.tsx` | Timeline rendering: `StatusDot`, `ToolCallNode`, timeline bars |
| `TextVisualizer` | Expanding tool parameters JSON |
| `CopilotInstrumentation.cs` | Provider constant pattern (add `claude-code` to `GenAiAttributes.Providers`) |
| `use-copilot.ts` | React Query hook pattern with staleTime/refetchInterval |

---

## 10. Acceptance Criteria

1. Operator sets 4 env vars, starts Claude Code, opens qyl dashboard → sees live session
2. Session list shows all Claude Code sessions with summary stats
3. Clicking a session shows timeline grouped by `prompt.id`
4. Each prompt group shows: user prompt text (if enabled), API calls with model/cost/tokens, tool results with success/failure/duration
5. Tool breakdown shows call counts and success rates per tool
6. Cost panel shows spend per model
7. Dashboard auto-refreshes without manual action
8. Claude Code has zero awareness of observation (no hooks, no injected context, no behavior change)
