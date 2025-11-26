# Copilot Instructions

> **For GitHub Copilot coding agent working in `ancplua-claude-plugins`.**

---

## Repository Overview

**ancplua-claude-plugins** is a Claude Code plugin marketplace plus experimental agent lab.

| Directory | Purpose |
|-----------|---------|
| `plugins/` | Individual Claude Code plugins (autonomous-ci, code-review, smart-commit) |
| `agents/` | Agent SDK-based agents that consume plugins |
| `skills/` | Reusable development workflow skills |
| `tooling/` | Scripts, templates, validation utilities |
| `docs/` | Architecture, specs, ADRs, workflows |

---

## Architecture: Type A (Application)

This repository is the **Application Layer (Type A)** - the "Brain" containing:

- Skills, Prompts, Orchestration
- Plugin definitions and configurations
- Workflow logic and agent coordination

**Sister Repository:** [`ancplua-mcp`](https://github.com/ANcpLua/ancplua-mcp) (Type T - Technology) contains actual tool implementations.

**Key Rule:** This repository NEVER contains MCP server implementations or C#/.NET code.

---

## Code Conventions

### Plugin Structure

Each plugin under `plugins/<name>/` follows:

```text
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json          # Manifest (required)
├── skills/
│   └── <skill-name>/
│       └── SKILL.md         # Skill definition
├── commands/                # Slash commands
├── hooks/
│   └── hooks.json           # Event hooks
├── scripts/                 # Shell utilities
└── README.md
```

### File Naming

- **Markdown:** kebab-case (`my-document.md`)
- **Scripts:** kebab-case (`verify-local.sh`)
- **JSON configs:** lowercase (`plugin.json`, `marketplace.json`)
- **Skills:** Directory per skill, file is always `SKILL.md`

### Code Style

- **Shell scripts:** Must pass `shellcheck`, use `set -euo pipefail`, quote all variables
- **Markdown:** Must pass `markdownlint`, 120 char line length, code blocks must specify language
- **YAML workflows:** Must pass `actionlint`, use specific action versions, minimal permissions

---

## FORBIDDEN in This Repository

- ❌ **NO C#/.NET code** - `.cs`, `.csproj`, `.sln` files belong in `ancplua-mcp`
- ❌ **NO absolute user paths** - `/Users/...`, `/home/...`, `C:\Users\...`
- ❌ **NO secrets or tokens** - API keys, OAuth tokens, credentials in code
- ❌ **NO hardcoded environment-specific values**

---

## Validation Commands

Before submitting changes, run:

```bash
# Full local validation (REQUIRED)
./tooling/scripts/local-validate.sh
```

This script runs shellcheck, markdownlint, actionlint, and JSON validation.

---

## Documentation Requirements

Every non-trivial change MUST update:

1. **CHANGELOG.md** - Entry under `## [Unreleased]`
2. **Specs** (`docs/specs/spec-XXXX-*.md`) - For new features
3. **ADRs** (`docs/decisions/ADR-XXXX-*.md`) - For architectural decisions

---

## Multi-AI Coordination

This repository uses multiple AI assistants (Claude, Jules, Gemini, CodeRabbit, Copilot).

### Shared Files for Coordination

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | What has been done - read to avoid duplicate work |
| `CLAUDE.md` | Claude Code operational spec |
| `GEMINI.md` | Gemini operational constitution |
| `AGENTS.md` | Context for Jules and external agents |

### Coordination Rules

- Read `CHANGELOG.md` first to see recent work and avoid duplicates
- Each AI performs independent, comprehensive reviews
- Do NOT speculate about what other AIs "might find"
- Update `CHANGELOG.md` when completing work

---

## Working on Tasks

### Before Starting

1. Check `CHANGELOG.md` for recent work
2. Understand the target architecture in `CLAUDE.md` section 3
3. Search for relevant skills: `find . -name 'SKILL.md'`

### During Implementation

1. Follow existing patterns in the codebase
2. Run validation frequently: `./tooling/scripts/local-validate.sh`
3. Keep changes minimal and focused

### Before Completion

1. Update `CHANGELOG.md` under `## [Unreleased]`
2. Ensure all validation passes
3. Document any architectural decisions

---

## Key Files to Read

- `CLAUDE.md` - Full operational spec and mandatory workflows
- `docs/ARCHITECTURE.md` - Detailed architecture documentation
- `docs/PLUGINS.md` - Plugin development standards
- `.markdownlint.json` - Markdown linting rules
