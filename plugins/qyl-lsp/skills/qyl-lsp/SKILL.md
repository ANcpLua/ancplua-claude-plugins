---
name: qyl-lsp
description: >-
  Implement LSP code intelligence tools in qyl.mcp. Six deterministic function
  tools (goto-definition, find-references, symbols, diagnostics, prepare-rename,
  rename) following the DebugTools/RiderMcpProxy pattern. Includes runtime stack,
  DI registration, server targets, and Loom bridge plan.
---

# qyl-lsp

Add semantic code intelligence to qyl via LSP tools in qyl.mcp.

This is not an agent. These are deterministic function tools that Loom
workflows call when they need code intelligence instead of grep.

## Read first

Before implementing, read the reference files:

- [placement.md](references/placement.md) — where things go in qyl's planes
- [tools.md](references/tools.md) — the 6 tool definitions
- [runtime-stack.md](references/runtime-stack.md) — process, transport, client
- [registration.md](references/registration.md) — DI and skill bucket wiring
- [servers.md](references/servers.md) — server definitions and language mappings
- [loom-bridge.md](references/loom-bridge.md) — phase 2 Loom integration

## Implementation order

### Phase 1: MCP surface

1. Create `src/qyl.mcp/Tools/Lsp/` with the runtime stack
2. Create `LspTools.cs` with 6 tool methods following the DebugTools pattern
3. Register under the existing `Debug` skill bucket in `QylSkillKind`
4. Wire DI in `Program.cs` and tools in `SkillRegistrationExtensions.cs`
5. Support `csharp-ls` first

### Phase 2: TypeScript support

6. Add `typescript-language-server --stdio` for `src/qyl.dashboard`
7. Server resolution by file extension + workspace root

### Phase 3: Loom bridge (only after MCP surface is stable)

8. Add `[LoomTool]` wrappers in `src/qyl.loom/V2/`
9. Stacked attributes: `[LoomTool]`, `[ToolSideEffect(None)]`,
   `[RequiresCapability]`
10. Emit compiler-driven metadata through the Loom descriptor path

## Architecture constraints

- LSP tools go in `qyl.mcp` — NOT `qyl.collector`
- These are leaf tools, not agents. `function` space, not `agent` space
- Reuse one LSP process per `(workspaceRoot, serverId)`
- Do `textDocument/didOpen` and `textDocument/didChange` properly
- Replace any fixed sleep with a real initialization/ready handshake
- Require absolute paths, validate against allowed workspace root
- Do not persist LSP process/session state as ledger truth
- `qyl.collector` must not own any of this

## Behavior rules

- `lsp_goto_definition`: return file path + line + column + preview
- `lsp_find_references`: return list of locations with context
- `lsp_symbols`: support both document and workspace symbols
- `lsp_diagnostics`: support file AND directory modes
- `lsp_prepare_rename`: return preview/validity signal, not the rename itself
- `lsp_rename`: apply `WorkspaceEdit` to disk, return concise edit summary
- All tools require absolute paths

## Do not

- Put LSP tools in `qyl.collector` — local workspace state is not collector truth
- Make an agent "figure out code navigation" with raw file scans
- Persist LSP process state in the ledger
- Use runtime reflection for tool discovery — use the generator path
- Add a new `QylSkillKind` member before the surface exists — reuse `Debug`

## Contracts

If you want typed payloads instead of markdown-only results, put DTOs in
`src/qyl.contracts/Agenting/` — that's the agent-facing code intelligence
surface, not collector telemetry. Add a `JsonSerializerContext` next to
the tool class for structured responses.
