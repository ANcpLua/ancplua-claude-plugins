# csharp-lsp

C# language server for Claude Code: csharp-ls (dotnet tool) over .cs files, so LSP tool lookups resolve C# symbols,
references and diagnostics.

## Requires

`csharp-ls` on `PATH` (`~/.dotnet/tools` after `dotnet tool install -g csharp-ls`). The plugin names the tool, not a
path, so it works on any machine that has the tool installed.

## Files

`.cs` are served by `csharp-ls` as configured in `.lsp.json`.

## Install

Enable from the `ancplua-claude-plugins` marketplace:

```text
/plugin   # enable csharp-lsp@ancplua-claude-plugins
```

or in `~/.claude/settings.json`:

```json
{ "enabledPlugins": { "csharp-lsp@ancplua-claude-plugins": true } }
```
