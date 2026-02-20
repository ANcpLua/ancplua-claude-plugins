# ancplua-claude-plugins Architecture

Claude Code plugin marketplace and agent lab.

---

## 1. Top-level layout

```text
ancplua-claude-plugins/
├── CLAUDE.md                    # Operational brain (routing, workflows, constraints)
├── AGENTS.md                    # Agent catalog for other AIs (Copilot, CodeRabbit)
├── README.md                    # Human-facing overview
├── CHANGELOG.md                 # Chronological change log
├── LICENSE
├── .gitignore
├── .coderabbit.yaml             # CodeRabbit review config
├── .markdownlint.json           # Markdown lint rules
├── .markdownlintignore          # Lint exclusions
│
├── .claude/
│   └── rules/                   # Auto-loaded rules (SOLID, error-handling, etc.)
│
├── .claude-plugin/
│   └── marketplace.json         # Plugin registry (source of truth)
│
├── .github/
│   ├── CODEOWNERS               # Code ownership rules
│   ├── copilot-instructions.md  # Copilot Coding Agent instructions
│   ├── dependabot.yml           # Dependency update config
│   └── workflows/
│       ├── auto-merge.yml       # Tiered auto-merge (Dependabot, Copilot, Claude)
│       ├── ci.yml               # Main CI (plugin validate, shellcheck, markdownlint)
│       ├── claude.yml           # Claude interactive (@claude mention trigger)
│       ├── claude-code-review.yml # Claude formal PR review
│       └── trigger-docs.yml     # Triggers ancplua-docs rebuild on push to main
│
├── plugins/                     # 7 plugins (22 commands, 5 skills, 9 agents)
│   ├── exodia/                  # Multi-agent orchestration (9 commands + 2 skills: eight-gates, hades)
│   ├── metacognitive-guard/     # Cognitive amplification + commit integrity + CI
│   ├── otelwiki/                # OpenTelemetry documentation + auto-sync
│   ├── hookify/                 # User-configurable rule-based hooks
│   ├── feature-dev/             # Guided feature development + code review
│   ├── dotnet-architecture-lint/# .NET build pattern enforcement
│   └── ancplua-project-routing/ # Cross-repo specialist agent routing
│
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   ├── ENGINEERING-PRINCIPLES.md # Alexander's 26 engineering principles (full narrative)
│   ├── PLUGINS.md               # Plugin creation guide
│   ├── QUICK-REFERENCE.md       # Quick reference card
│   ├── WORKFLOWS.md             # CI workflows and local validation
│   ├── specs/                   # Feature specs (spec-XXXX-*.md)
│   ├── decisions/               # ADRs (ADR-XXXX-*.md)
│   └── designs/                 # Design documents
│
└── tooling/
    ├── scripts/
    │   ├── weave-validate.sh    # Single validation entrypoint
    │   └── sync-marketplace.sh  # Marketplace sync helper
    └── templates/
        └── plugin-template/     # Scaffold for new plugins
```

---

## 2. Marketplace model

`.claude-plugin/marketplace.json` is the **single source of truth** for published plugins.

Each entry: `name`, `source` (relative path), `description`, `version`.

Each plugin lives under `plugins/<name>/` with its own manifest, docs, and optional
skills, commands, hooks, agents, and scripts.

---

## 3. Plugin structure

```text
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json      # Manifest (name, version, description, author)
├── CLAUDE.md            # Plugin-specific agent instructions
├── README.md            # User-facing documentation
├── skills/
│   └── <skill>/
│       └── SKILL.md     # Workflow guidance (YAML frontmatter required)
├── commands/
│   └── <command>.md     # Slash commands
├── agents/
│   └── <agent>.md       # Custom agent definitions (YAML frontmatter)
├── hooks/
│   └── hooks.json       # Event hooks (declared in plugin.json, loaded by Claude Code)
└── scripts/
    └── *.sh             # Shell helpers
```

**Required:** `.claude-plugin/plugin.json` + `README.md`

**All other directories are optional.** Not all plugins need all features.

### Passive context layers

Plugins contribute to the agent's passive context via three layers (in load order):

1. **`CLAUDE.md`** — static routing and constraints, always present
2. **`SKILL.md` frontmatter `description`** — loaded when skill is referenced
3. **`hooks/hooks.json` SessionStart → `additionalContext`** — dynamic, computed at session start

Use SessionStart hooks when context must be computed at runtime (version detection, prior findings, project-specific routing). Use CLAUDE.md for stable rules. Use skill descriptions for task-routing cues.

---

## 4. Validation and quality gates

Single local entrypoint: `./tooling/scripts/weave-validate.sh`

CI mirrors the same checks via `.github/workflows/ci.yml`.

| Gate | Tool | What it checks |
|------|------|----------------|
| Plugin validation | `claude plugin validate .` | Manifest schema, required fields |
| Shell scripts | `shellcheck` | Quoting, error handling, POSIX compliance |
| Markdown | `markdownlint` | Formatting, line length, structure |
| Workflows | `actionlint` | GitHub Actions syntax, permissions |
| JSON | `jq` | Syntax validity of all .json files |

---

## 5. Design principles (SOLID for plugins)

See `.claude/rules/solid-principles.md` (auto-loaded at session start) for the full SOLID plugin design constraints including the plugin responsibility table.

---

## 6. Tri-AI review system

Three AIs review PRs independently:

| Agent | Reviews | Creates Fix PRs | Config |
|-------|---------|-----------------|--------|
| Claude | `claude-code-review.yml` | Yes (CLI) | `CLAUDE.md` |
| Copilot | Built-in | Yes (Coding Agent) | `.github/copilot-instructions.md` |
| CodeRabbit | Built-in | No | `.coderabbit.yaml` |

Claude coordinates via passive context (`CLAUDE.md`, `.claude/rules/`, `SKILL.md` frontmatter, SessionStart hooks).
Copilot and CodeRabbit coordinate via `AGENTS.md`, `.github/copilot-instructions.md`, and `CHANGELOG.md`.
No real-time communication between AI systems.

---

## 7. DevOps (CALMS)

| Stage | Tool | Purpose |
|-------|------|---------|
| Local | `weave-validate.sh` | Pre-commit checks |
| CI | `ci.yml` | Automated validation |
| Review | `claude-code-review.yml` | AI-assisted review |
| Merge | `auto-merge.yml` | Tiered auto-merge |

### DORA targets

See `.claude/rules/devops-calms.md` (auto-loaded) for DORA metric targets and CALMS framework details.

---

## 8. Full ecosystem (beyond this marketplace)

This marketplace provides the orchestration brain. The complete developer setup includes
additional layers that are installed separately per user:

```text
Developer
 |
 +-- 7 custom plugins (this repo -- orchestration, guards, cleanup, routing)
 |
 +-- LSP plugins (Anthropic official -- per-language diagnostics + navigation)
 |    +-- C#, TypeScript, Python, C/C++, Go, Rust, etc.
 |
 +-- IDE MCP (JetBrains/VS Code -- build, run, refactor, query databases)
 |
 +-- Service MCP (GitHub, Slack, Sentry, etc. -- external integrations)
 |
 +-- Browser MCP (Chrome -- page automation, screenshots, form filling)
```

### How the layers compose

| Layer | What it does | Installed from |
|-------|-------------|----------------|
| **Plugins** (this repo) | Parallel agents, quality gates, routing, cleanup | `ancplua-claude-plugins` marketplace |
| **LSP** | Type errors after every edit, go-to-definition, find references | `claude-plugins-official` marketplace |
| **IDE MCP** | Build projects, run configs, rename refactoring, database queries | MCP server config |
| **Service MCP** | PRs, issues, messages, monitoring alerts | MCP server config or `claude-plugins-official` |
| **Browser MCP** | Automate Chrome tabs, capture screenshots, fill forms | MCP server config |

### Why separation matters

Each layer is independently optional. A user who only writes Python can install
`pyright-lsp` and skip C#. A user without JetBrains can skip the IDE MCP entirely.
The plugins from this marketplace work regardless of which other layers are present.

The plugins provide the **orchestration and quality** layer. The LSP and MCP layers
provide the **perception and action** layer. Together: one developer, parallel agents,
every step gated.

---

**Last Verified:** 2026-02-20
