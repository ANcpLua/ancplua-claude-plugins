# Tool Definitions

Six deterministic function tools. All follow the DebugTools pattern:
sealed class, constructor-injected client, `[McpServerTool]` + `[Description]`.

## Tool surface

### lsp_goto_definition

Go to the definition of a symbol at a given position.

- **Input:** `filePath` (absolute), `line` (1-based), `column` (1-based)
- **Output:** file path, line, column, and a preview of the target location
- **ReadOnly:** true
- **LSP method:** `textDocument/definition`

### lsp_find_references

Find all references to a symbol at a given position.

- **Input:** `filePath` (absolute), `line` (1-based), `column` (1-based),
  `includeDeclaration` (bool, default true)
- **Output:** list of locations with file path, line, column, and context line
- **ReadOnly:** true
- **LSP method:** `textDocument/references`

### lsp_symbols

List symbols in a document or search workspace symbols.

- **Input:** `filePath` (absolute, optional), `query` (string, optional)
- **Output:** list of symbols with name, kind, location, container
- **Behavior:** if `filePath` given → `textDocument/documentSymbol`;
  if `query` given → `workspace/symbol`
- **ReadOnly:** true

### lsp_diagnostics

Get diagnostics (errors, warnings) for a file or directory.

- **Input:** `path` (absolute — file or directory)
- **Output:** list of diagnostics with severity, message, file, line, column, source
- **Behavior:** file mode → single file diagnostics;
  directory mode → collect diagnostics from all files under the path
- **ReadOnly:** true
- **LSP method:** pull via `textDocument/diagnostic` or cached from
  `textDocument/publishDiagnostics`
- **Note:** directory diagnostics are high-value for analyzer and generator repos

### lsp_prepare_rename

Check if a symbol at a given position can be renamed, and preview the range.

- **Input:** `filePath` (absolute), `line` (1-based), `column` (1-based)
- **Output:** validity signal, rename range, and placeholder text
- **ReadOnly:** true
- **LSP method:** `textDocument/prepareRename`

### lsp_rename

Rename a symbol and apply the workspace edit to disk.

- **Input:** `filePath` (absolute), `line` (1-based), `column` (1-based),
  `newName` (string)
- **Output:** concise edit summary (files changed, edits per file)
- **ReadOnly:** false
- **LSP method:** `textDocument/rename` → `WorkspaceEdit` → apply to disk
- **Behavior:** calls `lsp_prepare_rename` internally first to validate

## C# shape

```text
[McpServerToolType]
public sealed class LspTools(LspClientWrapper client)
{
    [McpServerTool(Name = "lsp_goto_definition", ReadOnly = true)]
    [Description("Go to definition of symbol at position")]
    public Task<string> GotoDefinitionAsync(string filePath, int line, int column)

    [McpServerTool(Name = "lsp_find_references", ReadOnly = true)]
    [Description("Find all references to symbol at position")]
    public Task<string> FindReferencesAsync(string filePath, int line, int column, bool includeDeclaration = true)

    [McpServerTool(Name = "lsp_symbols", ReadOnly = true)]
    [Description("List symbols in document or search workspace")]
    public Task<string> SymbolsAsync(string? filePath = null, string? query = null)

    [McpServerTool(Name = "lsp_diagnostics", ReadOnly = true)]
    [Description("Get diagnostics for file or directory")]
    public Task<string> DiagnosticsAsync(string path)

    [McpServerTool(Name = "lsp_prepare_rename", ReadOnly = true)]
    [Description("Check if symbol at position can be renamed")]
    public Task<string> PrepareRenameAsync(string filePath, int line, int column)

    [McpServerTool(Name = "lsp_rename", ReadOnly = false)]
    [Description("Rename symbol and apply edits to disk")]
    public Task<string> RenameAsync(string filePath, int line, int column, string newName)
}
```

## Input validation

All tools must:

- Require absolute paths (`Path.IsPathFullyQualified`)
- Validate paths against an allowed workspace root
- Convert 1-based line/column to 0-based LSP positions internally
- Return user-friendly errors, not raw LSP error codes

## Output format

Return markdown text by default. If a `JsonSerializerContext` is registered,
return structured JSON. Follow the DebugTools pattern: convert raw LSP
responses to readable markdown with file paths and line numbers.
