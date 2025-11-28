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

## The "Shared Brain" Coordination Pattern

AIs (Claude, Jules, Gemini, CodeRabbit) cannot read each other's minds. They coordinate through **shared files**.

### AI Capability Matrix

| Tool | Reviews | Comments | Creates Fix PRs | Auto-Fix | Bypass Rules |
|------|---------|----------|-----------------|----------|--------------|
| Claude | ✅ | ✅ | ✅ (via CLI) | ❌ | ✅ |
| Jules | ✅ | ✅ | ✅ (API) | ❌ | ✅ |
| Copilot | ✅ | ✅ | ✅ (Coding Agent) | ❌ | ✅ |
| Gemini | ✅ | ✅ | ❌ | ❌ | ❌ |
| CodeRabbit | ✅ | ✅ | ❌ | ❌ | ✅ |

**Autonomous capabilities enabled via:**

- **Claude:** CLI with `gh pr create`, branch push via bypass rules
- **Copilot:** Coding Agent (assign issues with `@github-copilot`)
- **Jules:** API with `automationMode: "AUTO_CREATE_PR"`, `requirePlanApproval: false`

### How It Works

```text
┌─────────────────────────────────────────────────────────┐
│                    SHARED FILES                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ CHANGELOG   │ │ CLAUDE.md   │ │ AGENTS.md   │        │
│  │ (what's     │ │ (project    │ │ (agent      │        │
│  │  done)      │ │  rules)     │ │  context)   │        │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘        │
│         │               │               │               │
└─────────┼───────────────┼───────────────┼───────────────┘
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  CLAUDE   │   │   JULES   │   │  GEMINI   │
    │  (reads)  │   │  (reads)  │   │  (reads)  │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌───────────────────────┐
              │  Updates CHANGELOG    │
              │  when work complete   │
              └───────────────────────┘
```

### Shared Truth Files

| File | AI Reads To | AI Writes When |
|------|-------------|----------------|
| `CHANGELOG.md` | Know what's already done | Completing work |
| `CLAUDE.md` | Understand project rules | N/A (human-maintained) |
| `GEMINI.md` | Gemini-specific rules | N/A (human-maintained) |
| `AGENTS.md` | Agent context, constraints | N/A (human-maintained) |
| `git status` | Current repo state | (via git operations) |

### Communication Protocol

1. **At session start:** Read `CHANGELOG.md` to see recent work
2. **During work:** Follow rules in `CLAUDE.md` / `GEMINI.md`
3. **On completion:** Add entry to `CHANGELOG.md`

### Conflict Prevention

- Each AI sees the SAME shared files
- No direct AI-to-AI communication
- Humans synthesize overlapping findings
- CHANGELOG entries include AI attribution

### FORBIDDEN

- Guessing what another AI "might think"
- Adding "triangulation notes" about other AIs
- Claiming consensus without evidence

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
- Respect branch protection rules

**To enable fully autonomous Jules:**

Set `requirePlanApproval: false` in API calls for automatic fix PRs without human plan approval.

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
# Fully autonomous - no plan approval required
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
    "requirePlanApproval": false
  }'

# With plan approval (safer for complex changes)
curl 'https://jules.googleapis.com/v1alpha/sessions' \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $JULES_API_KEY" \
  -d '{
    "prompt": "Refactor the autonomous-ci plugin...",
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
- **Auto-merge:** Enabled for bot PRs via Mergify/GitHub auto-merge
- **Bot loop prevention:** Skip PRs from bot users or `jules/`, `copilot/` branches

---

## GitHub Settings for Maximum Autonomy

### 1. Copilot Coding Agent (Settings → Copilot → Coding Agent)

- Enable coding agent
- Disable firewall OR enable "Recommended allowlist"
- Configure MCP servers for extended capabilities

### 2. Copilot Code Review (Settings → Copilot → Code Review)

- ✅ Use custom instructions when reviewing pull requests
- ✅ Automatically request Copilot code review
- ✅ Review new pushes
- ✅ Review draft pull requests
- ✅ Manage static analysis tools (CodeQL, ESLint, PMD)

### 3. Branch Protection Bypass (Settings → Rules → Rulesets)

Add these apps to bypass list with "Always allow":

| App | Provider | Purpose |
|-----|----------|---------|
| Copilot coding agent | github | Autonomous code fixes |
| Claude | anthropic | CLI-based fixes |
| Google Labs Jules | google-labs-code | API-based fixes |
| Dependabot | github | Dependency updates |
| Renovate | mend | Dependency updates |
| Mergify | Mergifyio | Auto-merge |
| coderabbitai | coderabbitai | Review comments |
| Gemini Code Assist | google | Code suggestions |

### 4. Actions Permissions (Settings → Actions → General)

- ✅ Allow GitHub Actions to create and approve pull requests
- Workflow permissions: Read and write permissions

### 5. Auto-merge Configuration

Enable auto-merge in repository settings, then configure Mergify or GitHub native auto-merge rules.

---

## Getting Help

- **Claude Code docs:** <https://code.claude.com/docs>
- **Jules docs:** <https://jules.google/docs/>
- **Jules API:** <https://developers.google.com/jules/api>

---

## Contact

- **Owner:** AncpLua
- **Repository:** <https://github.com/ANcpLua/ancplua-claude-plugins>
