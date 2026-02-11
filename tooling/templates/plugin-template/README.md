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
│                             # MUST include "commands": "./commands"
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

### Autocomplete Rule

**Every user-invocable skill MUST have a `commands/<name>.md` file.**

The `commands/` directory is what the CLI indexes for `/` tab-completion.
`skills/` alone does NOT provide autocomplete. Use `skills/` only when
a skill needs extra features (hooks, argument-hint) that commands don't support.

If a skill has both `commands/<name>.md` and `skills/<name>/SKILL.md`,
the command provides autocomplete and the skill provides extended features.
Use different names to avoid double registration.

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
  "commands": "./commands"
}
```

The `"commands": "./commands"` field is **required** for autocomplete.

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
