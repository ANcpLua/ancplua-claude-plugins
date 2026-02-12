# Plugin Name

Brief description of what this plugin does.

## Features

- Feature 1: Description
- Feature 2: Description

## Installation

This plugin is part of the `ancplua-claude-plugins` marketplace.

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install <plugin-name>@ancplua-claude-plugins
```

## Commands

| Command | Description |
|---------|-------------|
| `/command` | What the command does |

## Directory Structure

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Required: name, description, version, author
├── README.md                 # This file
├── commands/
│   └── <command>.md         # Slash commands (required for CLI autocomplete)
├── skills/
│   └── <skill-name>/
│       └── SKILL.md         # Only for skills with hooks or argument-hint
├── agents/
│   └── <agent>.md           # Custom agents (optional)
├── hooks/
│   └── hooks.json           # Lifecycle hooks (optional)
└── scripts/
    └── <script>.sh          # Helper scripts (optional)
```

### Autocomplete

Both `commands/` and `skills/` directories are auto-discovered by
Claude Code and provide `/` tab-completion. The official docs mark
`commands/` as legacy; prefer `skills/<name>/SKILL.md` for new skills.

Use `commands/` when you need a simple markdown slash command without
the additional features that skills provide (hooks, argument-hint,
supporting files).

### plugin.json

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "What the plugin does.",
  "author": {
    "name": "AncpLua",
    "url": "https://github.com/ANcpLua"
  },
  "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
  "license": "MIT",
}
```

The `commands/` directory at the plugin root is auto-discovered. No `plugin.json` field needed.

## Usage Examples

### Example: With Command

```text
User: /<command> argument

Claude: [Executes command]
```

## Validation

Run local validation before committing:

```bash
./tooling/scripts/weave-validate.sh
```

## Related

- [Plugin Guidelines](../../docs/PLUGINS.md) - Plugin development guide
- [Official Plugin Docs](https://code.claude.com/docs/en/plugins)
