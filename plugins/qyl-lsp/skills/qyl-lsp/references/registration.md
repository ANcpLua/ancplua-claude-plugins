# Registration

How to wire LSP tools into qyl.mcp's DI and skill system.

## Step 1: Skill bucket

Register under the existing `Debug` bucket in `QylSkillKind.cs`.
Do NOT add a new enum member before the surface exists. The `Debug` bucket
already means "IDE-local capability" — LSP fits.

A dedicated `QylSkillKind.Lsp` member is appropriate only after the surface
is stable and you want independent feature-gating.

## Step 2: DI registration in Program.cs

In `ConfigureCommonServices()`, register the LSP runtime services:

```text
// LSP runtime
services.AddSingleton<LspServerDefinitions>();
services.AddSingleton<LspLanguageMappings>();
services.AddSingleton<LspServerInstallation>();
services.AddSingleton<LspServerResolution>();
services.AddSingleton<LspClientWrapper>();
services.AddSingleton<WorkspaceEditApplier>();

// LSP lifecycle
services.AddHostedService<LspManagerProcessCleanup>();
services.AddHostedService<LspManagerTempDirectoryCleanup>();
```

Gate behind skill configuration:

```text
if (skills.IsEnabled(QylSkillKind.Debug))
{
    // existing debug registrations...
    // LSP registrations here
}
```

## Step 3: Tool registration in SkillRegistrationExtensions.cs

In the `Debug` skill section, add:

```text
if (skills.IsEnabled(QylSkillKind.Debug))
{
    mcpBuilder
        .WithTools<DebugTools>(jsonOptions)
        .WithTools<LspTools>(jsonOptions);   // <-- add this
}
```

## Step 4: JSON serialization context (if structured payloads)

If `LspTools` returns structured JSON instead of markdown, add a
`LspJsonContext` class with `[JsonSerializable]` attributes for each
response type. Register it in Program.cs:

```text
jsonOptions.TypeInfoResolverChain.Add(LspJsonContext.Default);
```

## Step 5: Tool manifest

The `ToolManifestEmitter` source generator automatically discovers
`[McpServerToolType]` classes and adds them to `QylToolManifest.ToolTypes`.
No manual registration needed — `McpToolRegistry` picks up `LspTools`
automatically once the attribute is present.

## Pattern reference

Follow `DebugTools.cs` exactly:

```text
[McpServerToolType]
public sealed class LspTools(LspClientWrapper client)
{
    // Primary constructor injection
    // Each method: [McpServerTool] + [Description]
    // Return Task<string> (markdown) or Task<LspResult> (structured)
    // Catch domain exceptions, return friendly error strings
}
```

The proxy pattern from `RiderMcpProxy.cs` maps to `LspClientWrapper`:

| RiderMcpProxy | LspClientWrapper |
|---------------|-----------------|
| `GetOrConnectAsync()` | `EnsureServerRunning(workspaceRoot)` |
| `CallToolAsync(name, args)` | `GotoDefinitionAsync(uri, pos)` etc. |
| Auto-reconnect on URL change | Auto-restart on process crash |
| `IAsyncDisposable` | `IAsyncDisposable` |
