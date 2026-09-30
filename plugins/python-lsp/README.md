# python-lsp

Python language server for Claude Code: python-lsp-server (pylsp) over .py files.

## Requires

`pylsp` on `PATH` (`~/.local/bin` after `pipx install python-lsp-server`). The plugin names the tool, not a path, so
it works on any machine that has the tool installed.

## Files

`.py` are served by `pylsp` as configured in `.lsp.json`.

## Install

Enable from the `ancplua-claude-plugins` marketplace:

```text
/plugin   # enable python-lsp@ancplua-claude-plugins
```

or in `~/.claude/settings.json`:

```json
{ "enabledPlugins": { "python-lsp@ancplua-claude-plugins": true } }
```
