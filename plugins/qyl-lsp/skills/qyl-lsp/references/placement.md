# Placement

Where LSP tools go in qyl's plane architecture.

## Rule

LSP tools belong in `qyl.mcp` (serving plane). NOT in `qyl.collector` (data plane).

Local workspace state and language-server processes are not collector business truth.
The collector owns DuckDB, OTLP ingest, and platform state persistence.
LSP processes are runtime infrastructure — ephemeral, per-workspace, per-session.

## Entry points

The existing UI/protocol entry points are:

| File | Role |
|------|------|
| `src/qyl.mcp/Program.cs` | DI setup, transport resolution, service registration |
| `src/qyl.mcp/Skills/SkillRegistrationExtensions.cs` | Skill-gated tool registration |
| `src/qyl.mcp/Skills/QylSkillKind.cs` | Skill bucket enum (9 members) |

## Closest existing pattern

The Rider debugger proxy in `src/qyl.mcp/Tools/Debug/`:

| File | Pattern |
|------|---------|
| `DebugTools.cs` | Thin MCP facade — sealed class, constructor-injected proxy, `[McpServerTool]` methods |
| `RiderMcpProxy.cs` | Transport/connection — lazy connect, auto-reconnect, `IAsyncDisposable` |

LSP tools follow this exact pattern:

- `LspTools.cs` = thin facade (like `DebugTools.cs`)
- `LspClient.cs` + `LspClientTransport.cs` = transport (like `RiderMcpProxy.cs`)

## Tool discovery

The embedded agent surface in `src/qyl.mcp/Agents/McpToolRegistry.cs` discovers
MCP tool methods through `QylToolManifest.ToolTypes` (compile-time, source generator).
LSP tools become immediately usable by `use_qyl` once registered — no extra wiring.

## File layout

All LSP code goes under a single directory:

```text
src/qyl.mcp/Tools/Lsp/
├── LspTools.cs                      ← MCP facade (6 tool methods)
├── LspClient.cs                     ← High-level client API
├── LspClientWrapper.cs              ← Per-workspace wrapper with didOpen/didChange
├── LspClientConnection.cs           ← Connection lifecycle (init handshake)
├── LspClientTransport.cs            ← Stdio transport layer
├── LspProcess.cs                    ← Server process management
├── LspServerDefinitions.cs          ← Server catalog (csharp-ls, tsserver)
├── LspLanguageMappings.cs           ← Extension → server mapping
├── LspServerInstallation.cs         ← Server binary resolution
├── LspServerResolution.cs           ← Workspace → server selection
├── WorkspaceEditApplier.cs          ← Apply rename edits to disk
├── LspManagerProcessCleanup.cs      ← IHostedService: kill orphan servers
└── LspManagerTempDirectoryCleanup.cs ← IHostedService: clean temp state
```

## Contracts (optional, phase 2)

If you want typed payloads instead of markdown-only results, put DTOs in:

```text
src/qyl.contracts/Agenting/
├── LspLocation.cs
├── LspSymbol.cs
├── LspDiagnostic.cs
├── LspRenameResult.cs
└── LspPrepareRenameResult.cs
```

These are agent-facing code intelligence types, not collector telemetry.
`qyl.contracts` is BCL-only, zero NuGet deps — so these must be plain records.
