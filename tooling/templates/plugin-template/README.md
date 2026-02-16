# plugin-name

Brief description of what this plugin does.

## Overview

Explain the problem this plugin solves and how it works.

## Installation

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install plugin-name@ancplua-claude-plugins
```

## Commands

| Command | Description |
|---------|-------------|
| `/example-command [arg]` | What the command does |

## Architecture

```text
plugins/plugin-name/
├── .claude-plugin/
│   └── plugin.json       # Plugin manifest
├── CLAUDE.md             # Plugin context (auto-loaded)
├── README.md             # This file
├── commands/
│   └── example-command.md
├── skills/
│   └── example-skill/
│       └── SKILL.md
├── hooks/
│   └── hooks.json        # Lifecycle hooks
└── scripts/
    └── example-script.sh
```

## Usage

```text
/example-command argument
```

## Validation

```bash
./tooling/scripts/weave-validate.sh
```

## License

MIT
