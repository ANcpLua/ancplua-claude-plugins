# Compatibility Facts

Version-bound truths the audit knows. Each fact ties a package version to an API surface.

## How to check

1. Read `Version.props` to get installed versions
2. For each fact below, check whether the installed version has the feature
3. Grep source files for actual usage patterns
4. Report drift when code uses an old path that the installed version supersedes

## Known facts

### Microsoft.Extensions.AI (MEAI)

| Feature | Available since | Preferred path |
|---------|----------------|----------------|
| `AIFunctionFactoryOptions` | 10.0 | Configure parameter binding, result marshaling, schema exclusion via options instead of custom AIFunction subclass |
| `ConfigureParameterBinding` | 10.0 | Hide infra params (CancellationToken, IServiceProvider, ILogger) from model schema |
| `MarshalResult` | 10.0 | Control result boundary — strip internals, serialize to model-safe payloads |
| `ExcludeResultSchema` | 10.0 | Suppress return type schema when shape is dynamic or marshaled |
| `AIFunctionFactory.Create(method, options)` | 10.0 | Factory creation with options — replaces custom AIFunction subclasses |

**Drift signal:** Code uses `new LoomToolAIFunction(descriptor)` directly
when `AIFunctionFactory.Create` with `AIFunctionFactoryOptions` is available
and the `LoomToolFactoryBridge` exists.

### Microsoft Agent Framework (MAF)

| Feature | Package | Preferred path |
|---------|---------|----------------|
| `AddAIAgent()` | `Microsoft.Agents.AI.Hosting` | Hosted/DI registration for ASP.NET Core |
| `AsAIAgent()` | `Microsoft.Agents.AI` | Standalone agent creation for console apps |
| `RunAsync` / `RunStreamingAsync` | `Microsoft.Agents.AI` | Agent execution — replaces `GenerateResponseAsync` |
| `MapAGUI()` | `Microsoft.Agents.AI.Hosting.AGUI.AspNetCore` | AG-UI endpoint — replaces `MapQylAguiChat()` |
| `WithOpenTelemetry()` | `Microsoft.Agents.AI` | OTel middleware on hosted agents |
| `AgentWorkflowBuilder` | `Microsoft.Agents.AI.Workflows` | Typed workflow graphs with Executor steps |
| `WithInMemorySessionStore()` | `Microsoft.Agents.AI` | Session store — replaces custom implementations |

**Dead APIs (must not appear in code):**

| Dead | Replacement |
|------|-------------|
| `QylAgentBuilder` | `AddAIAgent()` or `AsAIAgent()` |
| `MapQylAguiChat()` | `MapAGUI()` |
| `GenerateResponseAsync` | `RunAsync` |
| `GenerateStreamingResponseAsync` | `RunStreamingAsync` |
| Custom `QylAgentSessionStore` | `WithInMemorySessionStore()` or `ChatHistoryProvider` |

### Session/Memory Model

- `RunAsync` / `RunStreamingAsync` create a fresh workflow per run
- Session IDs and conversation IDs do not imply shared memory between runs
- `AllowBackgroundResponses = true` is required for long-running agent work
- `InMemoryChatHistoryProvider` is gone on restart — not durable

### DuckDB

| Constraint | Value |
|------------|-------|
| Required runtime | glibc (Debian, not Alpine) |
| Column format | Columnar, not row-oriented |
| Access pattern | Only `qyl.collector` accesses DuckDB directly |

## Checking procedure

```text
1. Read Version.props
2. Extract: $(MicrosoftExtensionsAIVersion), $(MicrosoftAgentsAIVersion), etc.
3. For each version, determine which features from this table are available
4. Grep src/ for old API patterns (dead APIs, custom subclasses)
5. Emit compatibility_drift finding for each old pattern that has a replacement
```
