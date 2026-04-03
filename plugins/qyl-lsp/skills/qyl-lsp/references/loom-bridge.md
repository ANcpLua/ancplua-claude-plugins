# Loom Bridge (Phase 2)

How to expose LSP tools to Loom workflows. Only do this after the MCP surface
is stable and working.

## When Loom workflows need LSP

Loom workflows call LSP tools during detect/plan/fix/verify phases:

| Phase | LSP tool | Purpose |
|-------|----------|---------|
| Detect | `lsp_diagnostics` | Collect analyzer warnings across a project |
| Detect | `lsp_find_references` | Trace where a regressed symbol is consumed |
| Plan | `lsp_goto_definition` | Follow declaration chain to understand scope |
| Plan | `lsp_symbols` | Map the structure of affected files |
| Fix | `lsp_prepare_rename` | Validate rename is safe before applying |
| Fix | `lsp_rename` | Apply semantic rename across workspace |

Do not make an agent "figure out code navigation" with raw file scans when
`lsp_*` can answer semantically.

## Tool declaration pattern

Follow the existing `LoomV2Tools.cs` pattern — static methods with stacked
attributes:

```text
public static partial class LoomV2Tools
{
    [LoomTool("lsp_goto_definition",
        Description = "Go to definition of symbol at position",
        Phase = LoomPhase.Plan,
        UseOnlyWhen = "Need to follow a symbol to its declaration",
        DoNotUseWhen = "Symbol location is already known")]
    [ToolSideEffect(ToolSideEffect.None)]
    [RequiresCapability("qyl.loom.v2.code_intelligence")]
    [EmitsStructuredOutput(typeof(LspLocation))]
    public static LspLocation GotoDefinition(LspGotoDefinitionInput input)
        => ...;
}
```

## Side-effect classification

All LSP tools are `ToolSideEffect.None` except `lsp_rename`:

| Tool | Side Effect |
|------|-------------|
| `lsp_goto_definition` | `None` |
| `lsp_find_references` | `None` |
| `lsp_symbols` | `None` |
| `lsp_diagnostics` | `None` |
| `lsp_prepare_rename` | `None` |
| `lsp_rename` | `MutatesCode` + `[RequiresApproval]` |

`lsp_rename` writes to disk — it needs `[RequiresApproval]` and a capability
gate. In a workflow, it should be behind an approval port.

## Factory bridge integration

The Loom tool factory bridge in `LoomToolFactoryBridge.cs` converts
compiler-emitted metadata to `AIFunction` instances. For LSP tools:

- Parameter binding: `filePath`, `line`, `column` are AI-visible;
  `CancellationToken` and `IServiceProvider` are infrastructure-bound
- Result marshaling: serialize `LspLocation` / `LspRenameResult` to
  `JsonElement` via `[EmitsStructuredOutput]`
- Additional properties: `loom.phase`, `loom.sideEffect`,
  `loom.requiresApproval`, `loom.requiredCapabilities`

## Generator involvement

The `LoomSourceGenerator` automatically extracts `[LoomTool]` attributes
and emits descriptors. No manual registration needed — add the attributes,
rebuild, and the tools appear in `LoomGeneratedRegistry.Tools`.

Only add generator-level changes if you need custom descriptor fields
specific to LSP tools. The standard Loom pipeline handles everything else.

## Pattern parallel: oh-my-openagent

The oh-my-openagent LSP stack uses the same architecture with different
enforcement:

| oh-my-openagent (TS/Zod) | qyl Loom (C#/Roslyn) |
|---------------------------|----------------------|
| Tool function with Zod schema | `[LoomTool]` with stacked attributes |
| `AgentPromptMetadata.useWhen/avoidWhen` | `UseOnlyWhen` / `DoNotUseWhen` |
| Runtime agent registry | `LoomGeneratedRegistry.Tools` (compile-time) |
| `buildAgent()` factory | `LoomToolFactoryBridge.CreateCore()` |
| `createDelegateTask()` routing | `ConfigureParameterBinding` |
| Zod validation at runtime | Roslyn generators at compile time |

Same pattern, different enforcement point. qyl catches it at compile time.

## Do not

- Add Loom wrappers before the MCP tools work end-to-end
- Use runtime reflection for LSP tool discovery — use the generator
- Persist LSP state as ledger truth — it is ephemeral runtime infrastructure
- Bypass the factory bridge with manual `AddTool` calls
