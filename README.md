# ancplua-claude-plugins

**Claude Code plugins that make development faster and safer.**

## What's Inside

| Plugin | What It Does | Command |
|--------|--------------|---------|
| **code-review** | AI-powered code review (bugs, security, style) | `/code-review` |
| **smart-commit** | Generate semantic commit messages automatically | `/commit` |
| **autonomous-ci** | Verify CI will pass before you push | *ask Claude* |
| **jules-integration** | Delegate long tasks to Google Jules AI | `/jules <task>` |

---

## Quick Start

### Install Plugins in Your Project

```bash
cd your-project
claude
```

Then inside Claude Code (per [official docs](https://code.claude.com/docs/en/plugins)):

```text
# Add the marketplace
/plugin marketplace add ANcpLua/ancplua-claude-plugins

# Install a plugin
/plugin install code-review@ancplua-claude-plugins
/plugin install smart-commit@ancplua-claude-plugins
```

Or use the interactive browser:

```text
/plugin
# Select "Browse Plugins" to explore available plugins
```

### Use Them

```text
/code-review              # Review your changes
/commit                   # Generate commit message
/jules Fix the login bug  # Delegate to Jules
```

---

## Plugin Details

### code-review

Analyzes your code for issues before you commit.

```text
You: /code-review

Claude: ## Issues Found

  HIGH: SQL injection in auth.py:45
   Fix: Use parameterized queries

  MEDIUM: Unused import in utils.py:3
   Fix: Remove 'import os'

  No security vulnerabilities found
```

### smart-commit

Generates proper commit messages following Conventional Commits.

```text
You: /commit

Claude: Based on your changes, here's a commit message:

feat(auth): add JWT refresh token support

- Add refresh token generation on login
- Store refresh tokens in Redis with TTL
- Add /auth/refresh endpoint

Commit with this message? [Y/n]
```

### autonomous-ci

Runs the same checks CI will run - locally, before you push.

```text
You: Will CI pass if I push now?

Claude: Running CI checks locally...

  Tests: 47 passed
  Lint: No errors
  Build: Success
  Type check: 2 errors in src/api.ts

Fix the type errors before pushing.
```

### jules-integration

Hands off complex, long-running tasks to Google Jules.

```text
You: /jules Refactor the user service to use dependency injection

Claude: Created Jules task. Jules will:
1. Analyze current user service
2. Create a PR with DI refactoring
3. You'll get a notification when ready
```

---

## For Contributors

### Repository Structure

```text
ancplua-claude-plugins/
├── plugins/              # The plugins
│   ├── code-review/
│   ├── smart-commit/
│   ├── autonomous-ci/
│   └── jules-integration/
├── agents/               # Agent SDK experiments
├── skills/               # Shared development workflows
├── docs/                 # Architecture, specs, ADRs
└── tooling/              # Validation scripts
```

### Validate Changes

```bash
./tooling/scripts/local-validate.sh
```

### Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Rules for Claude when working on this repo |
| `GEMINI.md` | Rules for Gemini |
| `AGENTS.md` | Context for Jules and external agents |
| `CHANGELOG.md` | What changed and when |

---

## Architecture

This repo is **Type A (Application)** - the "Brain" containing orchestration logic.

It consumes tools from **Type T (Technology)** repos like `ancplua-mcp` which provide the "Hands".

**Rule:** No MCP server implementations here. Only plugin definitions, skills, and configs.

---

## AI Review System

PRs are reviewed by 5 AI agents:

| Agent | Can Create Fix PRs |
|-------|-------------------|
| Claude | Yes (via CLI) |
| Jules | Yes (via API) |
| Copilot | Yes (Coding Agent) |
| Gemini | No |
| CodeRabbit | No |

All agents review the same things independently. Overlapping findings = high confidence.

---

## Official Documentation

- [Plugins](https://code.claude.com/docs/en/plugins)
- [Skills](https://code.claude.com/docs/en/skills)
- [Hooks](https://code.claude.com/docs/en/hooks)
- [Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)

---

## License
This project is licensed under the [MIT License](LICENSE).
