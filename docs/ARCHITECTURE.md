# ancplua-claude-plugins Architecture

Claude Code plugin marketplace and agent lab.

---

## 1. Top-level layout

```text
ancplua-claude-plugins/
├── CLAUDE.md                    # Operational brain (routing, workflows, constraints)
├── README.md                    # Human-facing overview
├── CHANGELOG.md                 # Chronological change log
├── LICENSE
├── .gitignore
├── .coderabbit.yaml             # CodeRabbit review config (CCC-triad, Pro Plus)
├── .markdownlint.jsonc          # Markdown lint rules
├── .markdownlintignore          # Lint exclusions
│
├── .claude/
│   ├── commands/                # Repo-local slash commands
│   ├── rules/                   # Holds the Opus 4.8 System Card PDF
│   ├── workflows/               # Repo-local dynamic workflows
│   └── worktrees/               # Isolated agent worktrees
│
├── .claude-plugin/
│   └── marketplace.json         # Plugin registry (source of truth)
│
├── .github/
│   ├── CODEOWNERS               # Code ownership rules
│   ├── copilot-instructions.md  # Copilot Coding Agent instructions
│   ├── dependabot.yml           # Dependency update config
│   └── workflows/
│       ├── auto-merge.yml       # Native GitHub auto-merge for codex/ + copilot/ branches and Codex-approved PRs
│       ├── ci.yml               # Main CI (JSON/plugin/marketplace/SKILL validation, shellcheck, markdownlint, actionlint)
│       └── claude.yml           # Claude Code action — runs on @claude mentions in issues, PR reviews, comments
│
├── plugins/                     # 13 plugins (24 commands, 23 skills, 30 agents)
│   ├── cc-plugin-eval/           # Claude-Code-native plugin/skill evaluator (token budget, scoring, validators)
│   ├── charon/                   # PR-to-merge ferry — fixes CI, repairs conflicts, never just waits
│   ├── council/                  # Five-agent council via Teams API: Opus captain, researcher, clarity, synth, janitor
│   ├── derot/                    # Truth-drift / doc-rot auditor (/derot, /depmigrate)
│   ├── elegance-pipeline/        # Multi-agent code-elegance workflow: scouts → judges → planner → verifier → implementer
│   ├── exodia/                   # Multi-agent orchestration (7 commands + 2 skills: eight-gates, hades)
│   ├── feature-dev/              # Guided feature development with explorer/architect/reviewer agents
│   ├── html-effectiveness/       # Produce self-contained .html artifacts (dashboards, reports, diagrams) over markdown
│   ├── metacognitive-guard/      # Cognitive amplification + epistemic hooks + competitive review
│   ├── mutation-minded-testing/  # Mutation-minded, behavior-first test quality (4 agents)
│   ├── nihil/                    # First-principles repo transformation — every artifact must justify its existence
│   ├── nuget-opensrc/            # Fetch a NuGet package's exact build-commit source via opensrc
│   └── tomevault-publish/        # Publish skills / configs / plugins to TomeVault as Tomes
│
└── docs/
    ├── ARCHITECTURE.md          # This file
    ├── specs/                   # Feature specs (spec-XXXX-*.md)
    ├── decisions/               # ADRs (ADR-XXXX-*.md)
    └── schemas/                 # Agent-workflow JSON/YAML schemas
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

Use SessionStart hooks when context must be computed at runtime (version detection, prior findings,
project-specific routing). Use CLAUDE.md for stable rules. Use skill descriptions for task-routing cues.

---

## 4. Validation and quality gates

Validation runs in CI via `.github/workflows/ci.yml`. There is no local wrapper
script; run the gate tools below directly, or rely on CI.

| Gate | Tool | What it checks |
|------|------|----------------|
| Plugin validation | `claude plugin validate .` | Manifest schema, required fields |
| Shell scripts | `shellcheck` | Quoting, error handling, POSIX compliance |
| Markdown | `markdownlint` | Formatting, line length, structure |
| Workflows | `actionlint` | GitHub Actions syntax, permissions |
| JSON | `jq` | Syntax validity of all .json files |

---

## 5. Design principles (SOLID for plugins)

Each plugin has a single responsibility and is composed, not modified: add skills/commands/hooks
to extend behavior rather than overloading one plugin. The `.claude-plugin/plugin.json` manifest is
the contract; optional directories (`hooks/`, `commands/`, `agents/`) stay optional.

---

## 6. Tri-AI review system

Multiple AIs (Claude, Copilot, CodeRabbit) review PRs independently.

Config files per agent:

| Agent | Config |
|-------|--------|
| Claude | `CLAUDE.md`, `.claude/rules/`, SessionStart hooks |
| Copilot | `.github/copilot-instructions.md` |
| CodeRabbit | `.coderabbit.yaml` |

No real-time communication between AI systems.

---

## 7. DevOps (CALMS)

| Stage | Tool | Purpose |
|-------|------|---------|
| CI | `ci.yml` | Automated validation |
| Review | `claude.yml` | AI-assisted review |
| Merge | `auto-merge.yml` | Tiered auto-merge |

---

## 8. Full ecosystem (beyond this marketplace)

This marketplace provides the orchestration brain. The complete developer setup includes
additional layers that are installed separately per user:

```text
Developer
 |
 +-- 13 custom plugins (this repo -- orchestration, guards, cleanup, routing)
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

## 9. Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE` | Keep existing marketplace cache when `git pull` fails during plugin sync. Prevents plugin loss in offline environments, flaky networks, or private repos with expired tokens. | unset (cache is cleared on failure) |

Set in your shell profile (`~/.zshrc`, `~/.bashrc`):

```bash
export CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1
```

---

**Last Verified:** 2026-06-11
