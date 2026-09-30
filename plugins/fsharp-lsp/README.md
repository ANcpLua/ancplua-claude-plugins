# fsharp-lsp

F# language server for Claude Code: fsautocomplete (dotnet tool) over .fs, .fsx and .fsi files, rolled forward to the
newest installed runtime.

## Requires

`fsautocomplete` on `PATH` (`~/.dotnet/tools` after `dotnet tool install -g fsautocomplete`). The plugin names the
tool, not a path, so it works on any machine that has the tool installed.

## Files

`.fs`, `.fsx`, `.fsi` are served by `fsautocomplete` as configured in `.lsp.json`.

## Install

Enable from the `ancplua-claude-plugins` marketplace:

```text
/plugin   # enable fsharp-lsp@ancplua-claude-plugins
```

or in `~/.claude/settings.json`:

```json
{ "enabledPlugins": { "fsharp-lsp@ancplua-claude-plugins": true } }
```
