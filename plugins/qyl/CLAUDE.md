# qyl — Unified Plugin

Single source of truth for the qyl AI observability platform.

## Ground Truth (read Version.props + Directory.Packages.props for exact versions)

```
RUNTIME:    .NET 10.0 LTS, C# 14, net10.0
FRONTEND:   React 19, Vite 7, Tailwind CSS 4, Base UI 1.3.0, lucide-react, TanStack Table/Query, ECharts 6
DATABASE:   DuckDB 1.5.0 (columnar, glibc-required, Debian not Alpine)
OTEL:       SDK/API 1.15.0, Semantic Conventions 1.40 (these are DIFFERENT version tracks)
TESTING:    xUnit v3 + Microsoft Testing Platform v2 (NOT VSTest)
BUILD:      NUKE 10.1.0, CPM via Directory.Packages.props, centralized artifacts/
TYPESPEC:   @typespec/compiler 1.8.0 → openapi.yaml → TypeScript clients via openapi-typescript
DEPLOY:     Docker (Debian runtime, Node 22 + .NET SDK 10.0 multi-stage), Railway
```

## Real Projects (only these 8 exist in src/)

| Project | Type | Purpose |
|---------|------|---------|
| qyl.collector | ASP.NET Core Web | Main host: OTLP ingest, DuckDB, REST/gRPC, SSE |
| qyl.contracts | Class Library | Shared types, BCL-only, zero NuGet deps |
| qyl.instrumentation | Class Library | Runtime SDK, telemetry wiring |
| qyl.instrumentation.generators | Analyzer (Roslyn) | Compile-time code.* emission |
| qyl.collector.storage.generators | Analyzer (Roslyn) | DuckDB mapper codegen |
| qyl.loom | Console App (Exe) | Standalone: autofix, triage, MCP, Qyl.Agents. HTTP-only to collector |
| qyl.mcp | Class Library | MCP server surface |
| qyl.dashboard | esproj (React/Vite) | Frontend SPA |

## Ghost Projects (DO NOT reference — never existed or removed)

qyl.protocol, qyl.servicedefaults, qyl.servicedefaults.generator, qyl.browser,
qyl.copilot, qyl.hosting, qyl.watch, qyl.watchdog, qyl.cli, qyl.agents, qyl.workflows

## Microsoft Agent Framework RC (.NET only)

MAF has fundamentally changed from preview. The old APIs are DEAD.

### Two API Patterns (both current, different use cases)

**Pattern 1: Standalone (console apps, simple usage)**
```csharp
AIAgent agent = new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential())
    .GetChatClient(deploymentName)
    .AsAIAgent(new ChatClientAgentOptions
    {
        Name = "MyAgent",
        ChatOptions = new() { Instructions = "..." },
        AIContextProviders = [skillsProvider, historyProvider],
    });

AgentResponse response = await agent.RunAsync("prompt", session);
await foreach (var update in agent.RunStreamingAsync("prompt", session)) { }
AgentSession session = await agent.CreateSessionAsync();
```

**Pattern 2: Hosted/DI (ASP.NET Core — USE THIS FOR qyl.collector)**
```csharp
// Register IChatClient in DI
IChatClient chatClient = new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential())
    .GetChatClient(deploymentName).AsIChatClient();
builder.Services.AddSingleton(chatClient);

// Register agent via DI (returns IHostedAgentBuilder)
var pirateAgent = builder.AddAIAgent("name",
    instructions: "...",
    chatClientServiceKey: "chat-model");

// Configure via builder
pirateAgent.WithAITool(new MyTool());
pirateAgent.WithInMemorySessionStore();

// Register workflow
builder.AddWorkflow("my-workflow", (sp, key) =>
{
    var agent1 = sp.GetRequiredKeyedService<AIAgent>("agent-1");
    var agent2 = sp.GetRequiredKeyedService<AIAgent>("agent-2");
    return AgentWorkflowBuilder.BuildSequential(key, [agent1, agent2]);
});

// Expose via protocols
builder.Services.AddA2AServer();   // Agent-to-Agent
app.MapA2AServer();
app.MapAGUI("/", agent);           // AG-UI (web frontends, CopilotKit)
```

**Middleware/OTel/Skills/Background (both patterns)**
```csharp
// Middleware pipeline
AIAgent pipeline = new AIAgentBuilder(baseAgent)
    .UseOpenTelemetry(sourceName: "qyl")
    .Build();

// Or on hosted agent:
agent.WithOpenTelemetry(sourceName: "qyl", cfg => cfg.EnableSensitiveData = true);

// Skills from filesystem
var skills = new FileAgentSkillsProvider(skillPath: "skills/");

// Background responses
var options = new AgentRunOptions { AllowBackgroundResponses = true };
```

### Dead API (qyl-specific customs to eliminate)

```
QylAgentBuilder                    → use AddAIAgent() or AsAIAgent() + AIAgentBuilder
MapQylAguiChat()                   → use MapAGUI()
GenerateResponseAsync              → use RunAsync
GenerateStreamingResponseAsync     → use RunStreamingAsync
Custom QylAgentSessionStore        → use WithInMemorySessionStore() or ChatHistoryProvider
```

### NuGet Packages

```
Microsoft.Agents.AI                              # Core (prerelease)
Microsoft.Agents.AI.OpenAI                       # Azure OpenAI + OpenAI (prerelease)
Microsoft.Agents.AI.Workflows                    # Graph workflows (prerelease)
Microsoft.Agents.AI.Hosting.AGUI.AspNetCore      # AG-UI hosting
Microsoft.Agents.AI.CosmosNoSql                  # Cosmos chat history
```

### Key Types

```
AIAgent, ChatClientAgent, DelegatingAIAgent, AIAgentBuilder
AgentSession, ChatClientAgentSession, AgentSessionStateBag
AgentResponse, AgentResponse<T>, AgentResponseUpdate
AgentRunOptions, ChatClientAgentRunOptions
AIContext, AIContextProvider, MessageAIContextProvider
ChatHistoryProvider, InMemoryChatHistoryProvider, CosmosChatHistoryProvider
FileAgentSkillsProvider, TextSearchProvider, ChatHistoryMemoryProvider
OpenTelemetryAgent, LoggingAgent
PromptAgentFactory, ChatClientPromptAgentFactory
```

### Workflow Types

```
Executor, Edge, Workflow, WorkflowBuilder
InProcessExecution, StreamingRun
WorkflowEvent, WorkflowStartedEvent, WorkflowOutputEvent, WorkflowErrorEvent
ExecutorInvokedEvent, ExecutorCompletedEvent, AgentResponseEvent, AgentResponseUpdateEvent
SuperStepStartedEvent, SuperStepCompletedEvent, RequestInfoEvent
```

### Observability Spans (built into MAF)

```
invoke_agent <agent_name>     — top-level agent invocation
chat <model_name>             — LLM call
execute_tool <function_name>  — tool execution
workflow.build                — workflow compilation
workflow.session              — workflow lifetime
executor.process <id>         — individual executor
message.send                  — inter-executor messaging
```

## Banned Patterns

```
DateTime.Now/UtcNow            → DateTimeOffset.UtcNow or TimeProvider
Newtonsoft.Json                 → System.Text.Json
object _lock                   → Lock _lock = new() (C# 14)
#pragma warning disable         → fix the warning
[SuppressMessage]               → fix the warning
<NoWarn>                        → fix the warning
ISourceGenerator                → IIncrementalGenerator
SyntaxFactory                   → raw strings
Runtime reflection              → source generators
dynamic / ExpandoObject         → strongly-typed
.Result / .Wait()               → async/await
Radix UI / shadcn/ui            → Base UI primitives
asChild / Slot                  → Base UI composition
Phosphor icons                  → lucide-react
any (TypeScript)                → proper types
as casts (TypeScript)           → type guards
```

## MAF Usage Guide (overrides stale specs)

If any spec in qyl/specs/ contradicts this section, update the spec — not the code.
Migrate incrementally: when you touch a file that uses an old pattern, update it then.

**Authority chain**: `.claude/agent-framework.pdf` (C# only) > this file > qyl/specs/*.

| When you need... | Use this | Where it lives |
|---|---|---|
| AI agent inside qyl.collector (ASP.NET Core) | `builder.AddAIAgent("name", instructions, chatClientServiceKey)` — registers in DI, returns builder for config | `Microsoft.Agents.AI.Hosting` |
| AI agent inside qyl.loom (Console App) | `chatClient.AsAIAgent(new ChatClientAgentOptions { ... })` — no DI needed | `Microsoft.Agents.AI` |
| Agent exposed to web browsers / CopilotKit | `app.MapAGUI("/path", agent)` — handles SSE streaming, session IDs, state sync, human-approval flows automatically | `Microsoft.Agents.AI.Hosting.AGUI.AspNetCore` |
| Agent talking to other agents over network | `builder.Services.AddA2AServer()` + `app.MapA2AServer()` — Google A2A protocol | `Microsoft.Agents.AI.Hosting` |
| Multi-step deterministic pipeline (Loom triage) | `AgentWorkflowBuilder` — define steps as `Executor` classes, connect them with typed routes, run with streaming or checkpointing | `Microsoft.Agents.AI.Workflows` |
| OTel traces on every agent call | `.WithOpenTelemetry(sourceName: "qyl")` — automatically emits spans for agent invocation, LLM calls, and tool execution | `Microsoft.Agents.AI` |
| Agent remembers conversation across turns | `InMemoryChatHistoryProvider` (gone on restart) or `CosmosChatHistoryProvider` (survives restart, needs Azure Cosmos) | `Microsoft.Agents.AI` |
| Agent loads domain knowledge from SKILL.md files | `FileAgentSkillsProvider(skillPath)` — scans directories, advertises skills to LLM, agent decides when to load full content | `Microsoft.Agents.AI` |
| Agent returns typed C# object | `agent.RunAsync<PersonInfo>("describe John")` — deserializes LLM JSON into your type | `Microsoft.Agents.AI` |
| Long-running agent work (minutes, not seconds) | `AgentRunOptions { AllowBackgroundResponses = true }` — returns immediately with continuation token, poll for completion | `Microsoft.Agents.AI` |
| Intercept/modify every agent call | `agent.AsBuilder().Use(myMiddleware).Build()` — wraps agent in decorator pipeline (logging, auth, transforms) | `Microsoft.Agents.AI` |

## Architecture Boundaries

- Collector owns DuckDB. Loom/MCP read via HTTP (CollectorClient), NEVER direct DB access
- Contracts are BCL-only, zero NuGet deps
- Dashboard talks to collector REST API only, no ProjectReference to .NET
- Generators use IIncrementalGenerator, ForAttributeWithMetadataName, value-equatable models
- TypeSpec (core/specs/) is the schema source of truth → openapi.yaml → TypeScript

## Agents

10 agents: captain + 7 specialists (collector, dashboard, generators, genai-architect, test-engineer, integration, quality) + docs + general.

Commands: `/qyl:observe` (observability orchestration), `/qyl:calini` (parallel swarm).

## Coordination

CHANGELOG.md is the shared brain. All agents read before starting, update before finishing.
