# MAF Execution Model

## Decision Rule

| Work type | Use | Why |
|-----------|-----|-----|
| Deterministic computation | `function` via `[LoomTool]` | Pure, testable, no LLM overhead |
| Open-ended planning | `agent` (bounded reasoning) | LLM needed, constrained by `[LoomBudget]` |
| Multi-step lifecycle | `workflow` via `[LoomWorkflow]` | Explicit ordering, checkpointing, approval ports |

## How MAF Consumes Loom Descriptors

The Loom compiler emits descriptors. The runtime bridge converts them into MAF-consumable objects:

- `LoomGeneratedRegistry.ToAIFunctions()` -> `AIFunction[]` for MAF agent tools
- `LoomGeneratedRegistry.ToToolCatalog()` -> `AITool[]` for MAF agent tools
- Workflows built with `WorkflowBuilder` using `Executor` step classes

## AIFunctionFactoryOptions (.NET 10 Bridge)

The 3 power knobs:

### ConfigureParameterBinding

Hide infra params from model schema:
- CancellationToken, IServiceProvider, ILogger<T>, IHttpClientFactory, qyl runtime services
- Return `ParameterBindingOptions { ExcludeFromSchema = true, BindParameter = ... }`
- Called once per parameter at creation time

### MarshalResult

Control result boundary:
- Strip internal shapes, convert to model-safe payloads, summarize rich objects
- Critical for: patch results, validation results, evidence summaries, approval payloads

### ExcludeResultSchema

Suppress return type schema:
- When return shape is dynamic, marshaled differently, or would be misleading

Current: custom `LoomToolAIFunction` subclass.
End-state: `AIFunctionFactory.Create(method, AIFunctionFactoryOptions)` -- custom wrapper only where factory options can't express it.

## Hosting Patterns

Two patterns (both current, different use cases):

### Standalone (console apps, qyl.loom)

```csharp
chatClient.AsAIAgent(new ChatClientAgentOptions { ... })
```

### Hosted/DI (ASP.NET Core, qyl.collector)

```csharp
builder.AddAIAgent("name", instructions, chatClientServiceKey)
agent.WithOpenTelemetry(sourceName: "qyl")
app.MapAGUI("/", agent)  // AG-UI
```

## Dead APIs

Blocked by PreToolUse hook -- do not use.

| Dead | Replacement |
|------|-------------|
| QylAgentBuilder | `AddAIAgent()` or `AsAIAgent()` |
| MapQylAguiChat() | `MapAGUI()` |
| GenerateResponseAsync | `RunAsync` |
| GenerateStreamingResponseAsync | `RunStreamingAsync` |
