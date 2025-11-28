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

## Skills

| Skill | Description |
|-------|-------------|
| `skill-name` | What the skill enables Claude to do |

## Commands

| Command | Description |
|---------|-------------|
| `/command` | What the command does |

## Directory Structure

Per [official docs](https://code.claude.com/docs/en/plugins):

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Required: name, description, version, author
├── README.md                 # This file
├── skills/
│   └── <skill-name>/
│       └── SKILL.md         # Skill definition (name + description required)
├── commands/
│   └── <command>.md         # Slash commands
├── agents/
│   └── <agent>/             # Custom agents
├── hooks/
│   └── hooks.json           # Lifecycle hooks (optional)
└── scripts/
    └── <script>.sh          # Helper scripts (optional)
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VAR_NAME` | Yes/No | What it's for |

### MCP Tools (if applicable)

This plugin uses tools from `ancplua-mcp`:

- `ToolName` - What it does

## Usage Examples

### Example 1: Basic Usage

```text
User: Use the <skill-name> skill to do X

Claude: [Uses skill to accomplish X]
```

### Example 2: With Command

```text
User: /<command> argument

Claude: [Executes command]
```

## Validation

Run local validation before committing:

```bash
./tooling/scripts/local-validate.sh
```

## Related

- [SKILL.md](skills/<skill-name>/SKILL.md) - Skill documentation
- [Plugin Guidelines](../../docs/PLUGINS.md) - Plugin development guide
- [Official Plugin Docs](https://code.claude.com/docs/en/plugins)
