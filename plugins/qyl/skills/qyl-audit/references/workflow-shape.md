# Workflow Shape Rules

What qualifies as a valid MAF workflow shape in qyl.

## Valid shapes

### Typed workflow graph

- Uses `[LoomWorkflow]` and `[LoomStep]` attributes
- Steps are `Executor` subclasses with explicit inputs/outputs
- Workflow defines step ordering via `stepIds` parameter
- Run state is a typed record that accumulates phase outputs
- Approval ports (`RequestPort`) gate destructive actions

### Standalone agent invocation

- Uses `chatClient.AsAIAgent(options)` in console apps (qyl.loom)
- Uses `builder.AddAIAgent()` in ASP.NET Core (qyl.collector)
- Fresh workflow per `RunAsync` / `RunStreamingAsync` call
- No implicit shared memory between runs

### Background agent work

- Uses `AgentRunOptions { AllowBackgroundResponses = true }`
- Returns immediately with continuation token
- Appropriate for long-running operations (minutes, not seconds)

## Invalid shapes

### Background service as workflow engine

A `BackgroundService` or `IHostedService` that runs agent logic in a loop
is not a workflow. Workflows should be:

- Triggered by an explicit request
- Use `AgentWorkflowBuilder` for multi-step sequences
- Have explicit start and end conditions

**Check:** Grep for `BackgroundService` or `IHostedService` implementations
that invoke agents. Flag if they contain agent loops without explicit
workflow structure.

### Prompt chain orchestration

A while loop that calls `RunAsync` repeatedly with different prompts is not
a workflow. Use typed workflow graphs with `[LoomWorkflow]`.

**Check:** Grep for loops containing `RunAsync` or `RunStreamingAsync`.
Flag if not wrapped in a proper Executor/Workflow.

### Implicit session sharing

Code that assumes session state persists across separate `RunAsync` calls
without explicit session management is incorrect.

**Check:** Grep for session ID reuse patterns without explicit
`ChatHistoryProvider` wiring.

### Old orchestrator patterns coexisting with V2

If V2 workflow/step/executor patterns exist alongside V1 orchestrator
patterns for the same concern, flag it. Both should not exist simultaneously.

**Check:** For each workflow concern (e.g., autofix, triage), check whether
both old and new patterns exist.

## Checking procedure

```text
1. Glob for [LoomWorkflow] and [LoomStep] usage
2. Glob for BackgroundService/IHostedService in agent-related code
3. Grep for RunAsync/RunStreamingAsync call sites
4. For each call site, check:
   a. Is it inside a proper workflow step (Executor)?
   b. Or a one-shot agent invocation triggered by a request?
   c. Or a loop without workflow structure?
5. Check for V1/V2 overlap per concern
6. Emit workflow_shape_violation for invalid patterns
```
