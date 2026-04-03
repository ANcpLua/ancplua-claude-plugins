# Server Targets

Which LSP servers to support and how they map to qyl projects.

## Primary: csharp-ls

For all .NET projects in qyl:

| Project | Path |
|---------|------|
| qyl.collector | `src/qyl.collector` |
| qyl.contracts | `src/qyl.contracts` |
| qyl.instrumentation | `src/qyl.instrumentation` |
| qyl.instrumentation.generators | `src/qyl.instrumentation.generators` |
| qyl.collector.storage.generators | `src/qyl.collector.storage.generators` |
| qyl.loom | `src/qyl.loom` |
| qyl.mcp | `src/qyl.mcp` |

**Installation:** `dotnet tool install -g csharp-ls`

**Launch:** `csharp-ls` (stdio)

**Workspace root:** the repo root (where `.slnx` or `.sln` lives)

**Why csharp-ls:** lightweight, open-source, stdio-based, handles solution
files. OmniSharp is heavier and less suitable for headless use.

**High-value operations for qyl:**

- `goto_definition` — follow attribute-driven code across generator boundaries
- `find_references` — trace where generated types are consumed
- `prepare_rename` / `rename` — safe renames across partials and attribute-driven code
- `diagnostics` — catch analyzer warnings across generator and analyzer repos

## Secondary: typescript-language-server

For the dashboard:

| Project | Path |
|---------|------|
| qyl.dashboard | `src/qyl.dashboard` |

**Installation:** `npm install -g typescript-language-server typescript`

**Launch:** `typescript-language-server --stdio`

**Workspace root:** `src/qyl.dashboard`

## Also useful for: ANcpLua.Roslyn.Utilities

Path: `/Users/ancplua/ANcpLua.Roslyn.Utilities`

Start with C# only — that tree is overwhelmingly `.cs`, `.csproj`, `.slnx`.
This repo especially benefits from `goto_definition`, `find_references`,
`prepare_rename`, and `rename` because generators, analyzers, partials, and
attribute-driven code are where grep starts lying.

## Server resolution algorithm

```text
1. Extract extension from file path
2. Look up server ID:
   .cs, .csproj, .slnx, .sln → csharp-ls
   .ts, .tsx, .js, .jsx      → typescript-language-server
3. Determine workspace root:
   - Walk up from file path looking for .slnx, .sln, .csproj, package.json
   - Use the first match as workspace root
4. Check if a process exists for (workspaceRoot, serverId)
   - Yes → reuse
   - No  → start new, run initialize handshake
5. Return the connected client
```

## Capability requests

Request these capabilities from servers:

```text
textDocumentSync: Full (for simplicity) or Incremental (for performance)
definitionProvider: true
referencesProvider: true
documentSymbolProvider: true
workspaceSymbolProvider: true
renameProvider: { prepareProvider: true }
diagnosticProvider: true (or use publishDiagnostics notifications)
```
