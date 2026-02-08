# ancplua-claude-plugins Style Guide

## Repository Identity

**Repository**: Claude Code plugin marketplace — Skills, Plugins, Agent configurations, and workflow definitions.

## Critical Rules

### FORBIDDEN in This Repository

- **NO C#/.NET code** - `.cs`, `.csproj`, `.sln` files do not belong in this repository
- **NO absolute user paths** - `/Users/...`, `/home/...`, `C:\Users\...`
- **NO secrets or tokens** - API keys, OAuth tokens, credentials
- **NO hardcoded environment-specific values**

### REQUIRED for All Changes

- **CHANGELOG.md must be updated** for any non-trivial change
- **ADRs required** for architectural decisions (`docs/decisions/ADR-XXXX-*.md`)
- **Specs required** for new features (`docs/specs/spec-XXXX-*.md`)

## File Format Standards

### plugin.json (Required fields)

```json
{
  "name": "plugin-name",
  "version": "X.Y.Z",
  "description": "Clear description",
  "author": { "name": "...", "url": "..." },
  "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
  "license": "MIT"
}
```

### SKILL.md (Required structure)

```markdown
---
name: skill-name
description: When to use this skill
---

# Skill Title

## When to Use
- Trigger condition 1
- Trigger condition 2

## Process
1. Step one
2. Step two
```

### Shell Scripts

- Must pass `shellcheck`
- Quote all variables: `"$VAR"` not `$VAR`
- Use `set -euo pipefail` at script start
- Relative paths only (no hardcoded absolute paths)
- Must be executable: `chmod +x`

### YAML Workflows

- Must pass `actionlint`
- Use specific action versions (e.g., `actions/checkout@v4`)
- Principle of least privilege for permissions
- Quote GitHub expressions in shell: `"${{ ... }}"`

### Markdown

- Must pass `markdownlint`
- Line length: 120 characters max
- Code blocks must specify language
- Use ATX-style headings (`#` not underlines)
- Tables must be padded

## Directory Structure Conventions

```text
plugins/<name>/
├── .claude-plugin/plugin.json  # Required
├── README.md                    # Required
├── skills/<skill>/SKILL.md     # At least one
├── commands/*.md               # Optional
├── hooks/hooks.json            # Optional
└── scripts/*.sh                # Optional, must be +x
```

## Code Review Focus Areas

### 1. Plugin Schema Compliance

- Verify `plugin.json` has all required fields
- Check directory structure matches conventions
- Ensure `marketplace.json` entry exists and is accurate

### 2. Skills & Commands Quality

- SKILL.md has YAML frontmatter with `name` and `description`
- Trigger conditions are specific and actionable
- Command markdown follows template structure

### 3. Documentation Sync

- CHANGELOG.md updated under `## [Unreleased]`
- ADR exists if architectural decision was made
- README.md reflects current functionality

### 4. Shell Script Safety

- No unquoted variables (SC2086)
- No glob issues (SC2035)
- Proper error handling
- No hardcoded paths

### 5. Workflow Security

- Minimal permissions declared
- Secrets properly referenced
- No token exposure in logs

### 6. MCP Integration (if applicable)

- `.mcp.json` is valid JSON
- Paths are relative, not absolute
- Tool definitions match MCP SDK patterns

## Multi-AI Review System

This repository uses **Claude, Copilot, and CodeRabbit** for comprehensive PR reviews.

### All AIs Review the SAME Things

- Plugin schemas (`plugin.json`, `marketplace.json`)
- SKILL.md files (YAML frontmatter, workflow clarity)
- Shell scripts (shellcheck compliance, quoting)
- YAML workflows (actionlint, permissions)
- Documentation sync (CHANGELOG, ADRs, specs)

### Coordination via Shared Files

AIs coordinate through shared files, NOT real-time communication:

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | What has been done - read to avoid duplicate work |
| `CLAUDE.md` | Project rules and workflows |
| `.claude/rules/` | Auto-loaded modular rules |
| `AGENTS.md` | Agent routing index |

### FORBIDDEN in Reviews

- Do NOT speculate about what other AIs "might find"
- Do NOT add "triangulation notes" guessing other perspectives
- Focus on YOUR findings, not imagined consensus

## Severity Guidelines

| Severity | When to Use |
|----------|-------------|
| CRITICAL | Security issues, secrets exposed, breaking changes |
| HIGH | Missing required files, schema violations, failed validation |
| MEDIUM | Style violations, missing documentation, unclear code |
| LOW | Suggestions, minor improvements, formatting nits |

## Review Output Format

Structure reviews as:

1. **Summary**: What the PR does
2. **Verdict**: APPROVE / REQUEST_CHANGES / COMMENT
3. **Issues**: List with severity
4. **Suggestions**: Improvements (non-blocking)
5. **Praise**: What was done well
