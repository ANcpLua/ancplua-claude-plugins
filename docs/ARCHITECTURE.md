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
├── .gemini/                     # Gemini review config
│
├── .github/
│   ├── copilot-instructions.md  # Copilot Coding Agent instructions
│   └── workflows/
│       ├── auto-merge.yml       # Tiered auto-merge (Dependabot, Copilot, Claude)
│       ├── ci.yml               # Main CI (plugin validate, shellcheck, markdownlint)
│       ├── claude.yml           # Claude interactive (@claude mention trigger)
│       ├── claude-code-review.yml # Claude formal PR review
│       └── dependabot.yml       # Dependency update config
│
├── plugins/                     # 7 plugins (23 commands, 4 skills, 9 agents)
│   ├── exodia/                  # Multi-agent orchestration (10 commands + hades skill)
│   ├── metacognitive-guard/     # Cognitive amplification + commit integrity + CI
│   ├── otelwiki/                # OpenTelemetry documentation + auto-sync
│   ├── hookify/                 # User-configurable rule-based hooks
│   ├── feature-dev/             # Guided feature development + code review
│   ├── dotnet-architecture-lint/# .NET build pattern enforcement
│   └── ancplua-project-routing/ # Cross-repo specialist agent routing
│
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   ├── PLUGINS.md               # Plugin creation guide
│   ├── AGENTS.md                # Agent documentation
│   ├── WORKFLOWS.md             # Workflow documentation
│   ├── specs/                   # Feature specs (spec-XXXX-*.md)
│   └── decisions/               # ADRs (ADR-XXXX-*.md)
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
│   └── hooks.json       # Event hooks (auto-loaded by convention)
└── scripts/
    └── *.sh             # Shell helpers
```

**Required:** `.claude-plugin/plugin.json` + `README.md`

**All other directories are optional.** Not all plugins need all features.

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

**Single Responsibility** — each plugin does ONE thing:

| Plugin | Responsibility |
|--------|----------------|
| `exodia` | Multi-agent orchestration (10 commands + hades skill) |
| `metacognitive-guard` | Cognitive amplification, commit integrity, CI verification |
| `feature-dev` | Guided feature development + code review |
| `otelwiki` | OpenTelemetry documentation + sync |
| `hookify` | User-configurable behavior prevention hooks |
| `dotnet-architecture-lint` | .NET MSBuild/CPM pattern enforcement |
| `ancplua-project-routing` | Cross-repo specialist agent routing |

**Open/Closed** — extend via new skills/commands, don't modify core logic for edge cases.

**Interface Segregation** — only `plugin.json` + `README.md` required. Everything else opt-in.

**Dependency Inversion** — plugins orchestrate via skills. Skills define contracts.

---

## 6. Tri-AI review system

Three AIs review PRs independently:

| Agent | Reviews | Creates Fix PRs | Config |
|-------|---------|-----------------|--------|
| Claude | `claude-code-review.yml` | Yes (CLI) | `CLAUDE.md` |
| Copilot | Built-in | Yes (Coding Agent) | `.github/copilot-instructions.md` |
| CodeRabbit | Built-in | No | `.coderabbit.yaml` |

Coordination through shared files (`CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`), not real-time.

---

## 7. DevOps (CALMS)

| Stage | Tool | Purpose |
|-------|------|---------|
| Local | `weave-validate.sh` | Pre-commit checks |
| CI | `ci.yml` | Automated validation |
| Review | `claude-code-review.yml` | AI-assisted review |
| Merge | `auto-merge.yml` | Tiered auto-merge |

### DORA targets

| Metric | Target |
|--------|--------|
| Deployment Frequency | Multiple per day |
| Lead Time | < 1 hour |
| Change Failure Rate | < 15% |
| MTTR | < 30 minutes |

---

**Last Verified:** 2026-02-13
