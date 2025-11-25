# AGENTS.md

> **For Jules AI and other autonomous coding agents.**
>
> This file describes the agents, conventions, and workflows in `ancplua-claude-plugins`.

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

## Agents in This Repository

### 1. Claude Code Agents

Claude Code agents are defined in `agents/` and use the Claude Agent SDK.

| Agent | Purpose | Status |
|-------|---------|--------|
| `repo-reviewer-agent` | Reviews repository health, structure, code quality | Planned |
| `ci-guardian-agent` | Monitors CI runs, reports failures, suggests fixes | Planned |
| `sandbox-agent` | Isolated testing environment for plugin interactions | Planned |

**Configuration:** Each agent has `config/agent.json` defining its plugins, checks, and output format.

### 2. Jules Integration

Jules (Google Labs) can work on this repository via the API.

**Supported tasks for Jules:**

- Bug fixes in plugin code
- Documentation improvements
- Test additions
- Code cleanup and refactoring

**Constraints for Jules:**

- Do NOT modify `.claude-plugin/` manifests without explicit instruction
- Do NOT change `CLAUDE.md` or `AGENTS.md` without explicit instruction
- Do NOT auto-merge PRs (require human approval)
- Respect branch protection rules

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
│   └── hooks.json          # Event hooks
├── scripts/                # Shell utilities
└── README.md
```

### File Naming

- **Markdown:** kebab-case (`my-document.md`)
- **Scripts:** kebab-case (`verify-local.sh`)
- **JSON configs:** lowercase (`plugin.json`, `marketplace.json`)
- **Skills:** Directory per skill, file is always `SKILL.md`

### Code Style

- **Shell scripts:** Use `shellcheck` for linting
- **Markdown:** Use `markdownlint` for consistency
- **YAML workflows:** Use `actionlint` for validation

---

## Validation Commands

Before submitting changes, run:

```bash
# Full local validation
./tooling/scripts/local-validate.sh

# Plugin-specific validation
claude plugin validate plugins/<name>

# Marketplace validation
claude plugin validate .
```

---

## Documentation Requirements

Every non-trivial change MUST update:

1. **Specs** (`docs/specs/spec-XXXX-*.md`) - Feature contracts
2. **ADRs** (`docs/decisions/ADR-XXXX-*.md`) - Architectural decisions
3. **CHANGELOG.md** - Change log under `[Unreleased]`

---

## CI/CD Integration

### GitHub Actions

- `ci.yml` - Plugin validation, linting, workflow checks
- Jules workflows use the Jules API (not GitHub Actions marketplace)

### Jules API Integration

Jules tasks are created via API:

```bash
# Create a session
curl 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d '{
    "prompt": "Fix the bug in plugins/code-review/...",
    "sourceContext": {
      "source": "sources/github/ANcpLua/ancplua-claude-plugins",
      "githubRepoContext": { "startingBranch": "main" }
    },
    "automationMode": "AUTO_CREATE_PR",
    "requirePlanApproval": true
  }'
```

---

## Security Notes

- **API keys:** Store in GitHub Secrets (`JULES_API_KEY`), never in code
- **Permissions:** Jules workflows use minimal required permissions
- **Auto-merge:** Disabled by default; require human review
- **Bot loop prevention:** Skip PRs from bot users or `jules/` branches

---

## Getting Help

- **Claude Code docs:** <https://code.claude.com/docs>
- **Jules docs:** <https://jules.google/docs/>
- **Jules API:** <https://developers.google.com/jules/api>

---

## Contact

- **Owner:** AncpLua
- **Repository:** <https://github.com/ANcpLua/ancplua-claude-plugins>
