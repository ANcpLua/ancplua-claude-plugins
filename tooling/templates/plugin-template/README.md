# Plugin Template

Starter template for creating Claude Code plugins in `ancplua-claude-plugins`.

---

## Quick Start

```bash
# 1. Copy template to plugins/
cp -r tooling/templates/plugin-template plugins/my-plugin

# 2. Edit manifest
# Update plugins/my-plugin/.claude-plugin/plugin.json

# 3. Register in marketplace
# Add entry to .claude-plugin/marketplace.json

# 4. Validate
claude plugin validate plugins/my-plugin
```

---

## Directory Structure

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json       # REQUIRED - Plugin manifest
├── skills/
│   └── my-skill/
│       └── SKILL.md      # Skill definition with YAML frontmatter
├── commands/
│   └── my-command.md     # Slash command definition
├── hooks/
│   └── hooks.json        # Event hooks configuration
├── scripts/
│   └── *.sh              # Shell utilities (chmod +x)
└── README.md             # Plugin documentation
```

---

## File Formats

### plugin.json (Required)

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "What this plugin does",
  "author": {
    "name": "Your Name",
    "url": "https://github.com/username"
  },
  "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"]
}
```

### SKILL.md (Skills)

```markdown
---
name: my-skill
description: When to use this skill and what it does. Be specific.
---

# Skill Title

## Overview
What this skill helps with.

## When to Use
- Trigger condition 1
- Trigger condition 2

## Process
1. Step one
2. Step two

## Examples
...
```

### Command (commands/*.md)

```markdown
---
name: my-command
description: What this command does
arguments:
  - name: arg1
    description: First argument
    required: true
---

# /my-command

Usage and behavior description.
```

### hooks.json (Hooks)

```json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "matcher": { "tool_name": "Bash" },
      "command": "./scripts/my-hook.sh"
    }
  ]
}
```

---

## Registration

Add to `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "0.1.0",
  "source": "./plugins/my-plugin"
}
```

---

## Validation Checklist

- [ ] `plugin.json` has `name`, `version`, `description`
- [ ] Skills have YAML frontmatter with `name` and `description`
- [ ] Scripts are executable (`chmod +x`)
- [ ] Added to `marketplace.json`
- [ ] `claude plugin validate plugins/my-plugin` passes

---

## Examples

See existing plugins for patterns:

| Plugin | Features |
|--------|----------|
| `plugins/autonomous-ci/` | Skills, scripts, hooks |
| `plugins/code-review/` | Skills, commands |
| `plugins/smart-commit/` | Skills, commands |
| `plugins/jules-integration/` | Skills, commands, scripts |

---

## Resources

- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins.md)
- [Skills Guide](https://code.claude.com/docs/en/skills.md)
- [Hooks Reference](https://code.claude.com/docs/en/hooks.md)
