# Runtime Stack

12 files under `src/qyl.mcp/Tools/Lsp/`. Layered from low-level process
management up to the high-level client API.

## Layer 1: Server catalog

### LspServerDefinitions.cs

Built-in server registry. Each entry defines:

- Server ID (e.g. `csharp-ls`, `typescript-language-server`)
- Binary name or command
- Arguments (e.g. `--stdio`)
- Initialization options
- Supported capabilities to request

### LspLanguageMappings.cs

Maps file extensions to server IDs:

| Extension | Server ID |
|-----------|-----------|
| `.cs`, `.csproj`, `.slnx`, `.sln` | `csharp-ls` |
| `.ts`, `.tsx`, `.js`, `.jsx` | `typescript-language-server` |

### LspServerInstallation.cs

Resolves server binary location:

- Check PATH first
- Check well-known install locations
- Return absolute path or throw with install instructions

### LspServerResolution.cs

Given a file path, resolve which server to use:

1. Extract extension from file path
2. Look up server ID via `LspLanguageMappings`
3. Resolve binary via `LspServerInstallation`
4. Return `(serverId, binaryPath, args)`

## Layer 2: Process and transport

### LspProcess.cs

Manages the language server OS process:

- Start process with stdio redirection
- Track PID for cleanup
- Handle process exit/crash
- Provide `stdin` (write) and `stdout` (read) streams
- One process per `(workspaceRoot, serverId)` — reuse across calls

### LspClientTransport.cs

Stdio JSON-RPC transport over the process streams:

- Read/write LSP JSON-RPC messages (Content-Length header framing)
- Request/response correlation via message IDs
- Notification handling (no response expected)
- Async message pump on stdout
- Serialize/deserialize with `System.Text.Json`

## Layer 3: Client connection

### LspClientConnection.cs

Manages the LSP protocol lifecycle:

- Send `initialize` request with client capabilities
- Wait for `initialized` notification
- **Real initialization handshake** — do not use fixed sleep
- Track server capabilities from `InitializeResult`
- Handle `shutdown` / `exit` on disposal

### LspClient.cs

Typed LSP method layer over the transport:

- `GotoDefinitionAsync(uri, position)` → `Location[]`
- `FindReferencesAsync(uri, position, context)` → `Location[]`
- `DocumentSymbolsAsync(uri)` → `DocumentSymbol[]`
- `WorkspaceSymbolsAsync(query)` → `SymbolInformation[]`
- `DiagnosticsAsync(uri)` → `Diagnostic[]` (pull or cached)
- `PrepareRenameAsync(uri, position)` → `PrepareRenameResult`
- `RenameAsync(uri, position, newName)` → `WorkspaceEdit`
- `DidOpenAsync(uri, text, languageId)`
- `DidChangeAsync(uri, text, version)`
- `DidCloseAsync(uri)`

### LspClientWrapper.cs

Per-workspace wrapper that handles document lifecycle:

- Track which documents are open
- Auto `didOpen` on first access to a file
- Auto `didChange` when file content differs from last known
- Read file content from disk for `didOpen`
- Validate paths against allowed workspace root
- Convert 1-based (user) to 0-based (LSP) positions

## Layer 4: Edit application

### WorkspaceEditApplier.cs

Applies `WorkspaceEdit` results from `textDocument/rename` to disk:

- Parse `WorkspaceEdit` (document changes and/or resource operations)
- Apply text edits in reverse order (bottom-up to preserve positions)
- Write modified files to disk
- Return summary: files changed, edits per file
- Handle `createFile`, `renameFile`, `deleteFile` resource operations

## Layer 5: Lifecycle services

### LspManagerProcessCleanup.cs

`IHostedService` that cleans up orphaned LSP server processes:

- Track all spawned PIDs
- Kill remaining processes on application shutdown
- Periodic health check: restart crashed servers on next request

### LspManagerTempDirectoryCleanup.cs

`IHostedService` that cleans temporary state:

- Remove stale workspace state directories
- Run on startup and periodic interval
- Do not clean active workspaces

## Key design rules

- One LSP process per `(workspaceRoot, serverId)` — never per tool call
- Real initialization handshake, not fixed sleep
- `didOpen` / `didChange` must happen before any query on a document
- Process cleanup on application shutdown — no orphans
- All paths validated as absolute before any LSP call
- `CancellationToken` threaded through every async operation
