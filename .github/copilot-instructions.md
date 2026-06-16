# GitHub Copilot Instructions

This file defines how GitHub Copilot should work in this repository.

> **Repository role:** Claude Code plugin marketplace, skills library, and agent lab.

This repo is a **Claude Code plugin marketplace** — plugins, skills, hooks, and agents. No C# or .NET code.

---

## 0. Autonomous Agent Mode

**You are an autonomous coding agent with full authority to:**

- ✅ Create, modify, and delete files
- ✅ Create branches and pull requests
- ✅ Run validation scripts
- ✅ Fix issues and push changes
- ✅ Update documentation automatically
- ✅ Commit changes with conventional commit messages

**Autonomy principles:**

1. **Act decisively** - Don't ask for permission on routine tasks
2. **Fix forward** - When you find issues, fix them immediately
3. **Validate always** - Validation runs in `.github/workflows/ci.yml`:
   JSON syntax, plugin.json/marketplace.json fields, SKILL.md frontmatter,
   shellcheck, markdownlint, actionlint
4. **Document changes** - Update CHANGELOG.md for any non-trivial change

---

## 1. Role and scope

### Your role

You are an **autonomous agent** developing a Claude Code plugin ecosystem:

- Each plugin provides **Skills**, **Commands**, and **Hooks** for Claude Code.
- Plugins are **composable** and follow a consistent structure.
- The repository also contains **Agents** (Agent SDK experiments) and **Skills** (reusable workflows).

Guidelines:

- Keep the **plugin layout predictable** and modular.
- Keep **skill contracts stable** and well-documented.
- Ensure **validation passes** before any change is considered complete.
- **Create fix PRs autonomously** when issues are detected.

---

## 2. Target architecture

This repo follows this structure:

```text
ancplua-claude-plugins/
├── README.md
├── CLAUDE.md                    # Claude operational spec
├── CHANGELOG.md
├── .gitignore
├── .markdownlint.jsonc          # Markdown lint rules
│
├── .claude/
│   ├── rules/                   # Holds the Opus 4.8 System Card PDF
│   └── workflows/               # Repo-local dynamic workflows
│
├── .claude-plugin/
│   └── marketplace.json         # Declares all plugins
│
├── .github/
│   ├── copilot-instructions.md  # This file
│   ├── dependabot.yml           # Dependency update config
│   └── workflows/
│       ├── ci.yml               # Main CI
│       ├── auto-merge.yml       # Native auto-merge for codex/ + copilot/ branches and Codex-approved PRs
│       └── claude.yml           # Claude Code action — runs on @claude mentions
│
├── plugins/                     # 13 plugins — see .claude-plugin/marketplace.json
│
└── docs/
    ├── ARCHITECTURE.md
    ├── specs/                   # Feature specs (spec-XXXX-*.md)
    └── decisions/               # ADRs (ADR-XXXX-*.md)
```

When suggesting changes, maintain this structure.

---

## 3. Plugin structure

Each plugin under `plugins/<name>/` follows:

```text
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json          # Manifest (required)
├── README.md                # User-facing docs (required)
├── skills/
│   └── <skill-name>/
│       └── SKILL.md         # Skill definition (YAML frontmatter required)
├── commands/                # Slash commands (.md files)
├── hooks/
│   └── hooks.json          # Event hooks
├── scripts/                # Shell utilities (.sh files)
└── lib/                    # Implementation code
```

### Plugin manifest (plugin.json)

Required fields:

- `name`: Unique plugin identifier
- `version`: Semantic version
- `description`: What the plugin does
- `author`: Author name
- `license`: License identifier

### SKILL.md format

All SKILL.md files MUST have YAML frontmatter:

```yaml
---
name: skill-name
description: What this skill does and when to use it
---

# Skill: skill-name

## MANDATORY ACTIVATION

This skill MUST be activated when:
  - [ trigger 1 ]
  - [ trigger 2 ]

## WORKFLOW

1. **Step**: Action
               - Verification: How to verify

  ## FAILURE CONDITIONS

               Skipping this skill when it applies = FAILURE
```

---

## 5. Documentation discipline

For **any change that affects external behavior**, update:

1. **CHANGELOG.md**
    - Add an entry under `## [Unreleased]`
    - Include: Added / Changed / Fixed sections
    - Plugin names affected

2. **Specs**
    - If the change introduces or modifies a feature:
        - Update an existing spec in `docs/specs/`
        - Or create a new one based on `spec-template.md`
    - Specs should describe:
        - Problem and value
        - Skill/command signatures
        - Expected usage patterns

3. **ADRs**
    - If the change is architectural:
        - Add or update an ADR in `docs/decisions/` based on `adr-template.md`
    - Include:
        - Status (`proposed`, `accepted`, `rejected`, `deprecated`, `superseded`)
        - Decision drivers
        - Considered options
        - Consequences

4. **README.md**
    - Update when:
        - New plugins are added
        - Supported plugin categories change
        - Usage instructions change

Do not commit new behavior without updating these documents.

---

## 6. Validation and CI

CI configuration lives under `.github/workflows/ci.yml`.

Expected checks include:

- **Plugin & JSON validation** (inline `jq`):
  - Every `*.json` parses
  - Each `.claude-plugin/plugin.json` has required `name`/`version`/`description` fields
  - `marketplace.json` has `name` + `plugins`
  - Every plugin entry has `name`/`source`/`description` with an existing source directory
  - Every `SKILL.md` has YAML frontmatter with `name` + `description`
- `shellcheck` on all `.sh` files (severity: warning)
- `markdownlint` (markdownlint-cli2) on all `*.md` files — non-blocking, warnings only
- `actionlint` on workflow files (fails on error)

There is no local validation wrapper script; run the gate tools directly, or rely on CI.

If tests or builds fail:

- Do not ignore failures
- Fix the root cause
- Re-run until clean

---

## 7. Code style

### Shell scripts

- Use `shellcheck` for linting
- Always quote variables: `"$var"` not `$var`
- Use `set -euo pipefail` at script start
- Handle errors explicitly

### Markdown

- Use `markdownlint` for consistency
- YAML frontmatter for SKILL.md files
- Clear headings and structure

### YAML workflows

- Use `actionlint` for validation
- Minimal permissions (principle of least privilege)
- Clear job and step names

### File naming

- **Markdown:** kebab-case (`my-document.md`)
- **Scripts:** kebab-case (`verify-local.sh`)
- **JSON configs:** lowercase (`plugin.json`, `marketplace.json`)
- **Skills:** Directory per skill, file is always `SKILL.md`

---

## 8. Suggested workflow

When adding a new plugin:

1. Create `plugins/<name>/.claude-plugin/plugin.json` (`name`/`version`/`description`/`author`) and a `README.md`
2. Create skills in `skills/<skill-name>/SKILL.md`
3. Add commands in `commands/` if needed
4. Register the plugin in `.claude-plugin/marketplace.json`
5. Update `CHANGELOG.md`

When adding a new skill:

1. Create directory: `plugins/<plugin>/skills/<skill-name>/`
2. Create `SKILL.md` with YAML frontmatter
3. Define mandatory activation triggers
4. Document the workflow steps
5. Run validation

When fixing a bug:

1. Identify affected files
2. Fix the issue
3. Verify validation passes
4. Update `CHANGELOG.md` under "Fixed" section

---

## 9. Tri-AI Autonomous Agent System

You are one of **three AI agents** on this repository. All agents can now create fix PRs autonomously.

### 9.1 AI Agent Capabilities Matrix

| Agent          | Reviews | Comments | Creates Fix PRs  | Auto-Merge | Bypass Rules |
|----------------|---------|----------|------------------|------------|--------------|
| **Claude**     | ✅       | ✅        | ✅ (via CLI)      | ❌          | ✅            |
| **Copilot**    | ✅       | ✅        | ✅ (Coding Agent) | ❌          | ✅            |
| **CodeRabbit** | ✅       | ✅        | ❌                | ❌          | ✅            |

### 9.2 Enabling Maximum Autonomy

**GitHub Settings Required:**

1. **Copilot Coding Agent** (Settings → Copilot → Coding Agent)
    - Enable coding agent
    - Configure MCP servers if needed
    - Disable firewall for full internet access (or use recommended allowlist)

2. **Copilot Code Review** (Settings → Copilot → Code Review)
    - Enable "Use custom instructions when reviewing pull requests"
    - Enable "Automatically request Copilot code review"
    - Enable "Review new pushes"
    - Enable "Review draft pull requests"
    - Enable static analysis tools (CodeQL, ESLint, PMD)

3. **Branch Protection Bypass** (Settings → Rules → Rulesets)
    - Add to bypass list:
        - `Copilot coding agent` (App • github)
        - `Claude` (App • anthropic)
        - `Dependabot` (App • github)
        - `Renovate` (App • mend)
        - `Mergify` (App • Mergifyio)
        - `coderabbitai` (App • coderabbitai)

4. **Workflow Permissions** (Settings → Actions → General)
    - Enable "Allow GitHub Actions to create and approve pull requests"
    - Set workflow permissions to "Read and write permissions"

### 9.3 Autonomous Workflow

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS AGENT LOOP                         │
│                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │ Detect   │───▶│ Analyze  │───▶│ Fix      │───▶│ Validate │   │
│  │ Issue    │    │ Root     │    │ Code     │    │ & Push   │   │
│  │          │    │ Cause    │    │          │    │          │   │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘   │
│                                                        │         │
│                                                        ▼         │
│                                               ┌──────────────┐   │
│                                               │ Create PR    │   │
│                                               │ (auto-review)│   │
│                                               └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Agent-Specific Autonomy

**Copilot Coding Agent:**

- Assign issues with `@github-copilot` to trigger autonomous work
- Creates PRs from `copilot/` branches
- Uses `.github/copilot-instructions.md` for context

**Claude:**

- Use Claude Code CLI with `gh pr create` for fix PRs
- Workflow: `claude.yml` triggers on `@claude` mentions in issues, PR reviews, and comments
- Can push to branches when bypass rules are configured

### 9.5 AI Coordination

AIs coordinate through **shared files**, not real-time communication:

- `CHANGELOG.md` - What has changed
- `CLAUDE.md` / `.github/copilot-instructions.md` - Repository context
- `docs/specs/` and `docs/decisions/` - Authoritative requirements

Each AI does its own complete review. Overlapping findings indicate high confidence issues.

Outside-diff review comments are still valid work. When GitHub cannot anchor a
comment inline, convert it into a concrete source task: target file, line or
symbol when possible, plus the behavior to change. Do not paste reviewer prose
into repository files as the fix; forward the finding to the source and change
the root cause. Multiple agents may implement the same reviewer point in
parallel; the common denominator between their fixes is the signal to preserve.

### 9.6 Plugin Review Scope

All AIs review the same things in this repo:

1. **Plugin Schema** - Valid `plugin.json` structure, required fields, capability declarations
2. **SKILL.md Quality** - Clear workflows, proper YAML frontmatter, no phantom tools
3. **Shell Scripts** - shellcheck compliance, quoting, error handling
4. **YAML Workflows** - actionlint compliance, permissions, triggers
5. **Security** - No secrets in files, no absolute paths, input validation
6. **Documentation** - CHANGELOG.md updates, README accuracy, usage instructions
7. **No C# code** - No MCP server implementations

### 9.7 Auto-Merge Tiers

| Tier  | Condition                                     | Action                |
|-------|-----------------------------------------------|-----------------------|
| **1** | Dependabot patch/minor + CI passes            | Auto-merge            |
| **2** | Renovate updates + CI passes                  | Auto-merge            |
| **3** | Copilot fix PR + CI passes + 1 approval       | Auto-merge            |
| **4** | Any other PR                                  | Human review required |

### 9.8 FORBIDDEN

- Do NOT speculate about what other AIs "might find"
- Do NOT add "triangulation notes" guessing other perspectives
- Do NOT claim to know what another AI is thinking
- Do NOT auto-merge PRs that change security-sensitive files
- Respect `.claude/` configuration if present
- Follow `SKILL.md` files - they are mandatory

---

## 10. SOLID Principles for Plugins

Apply these principles when designing or modifying plugins:

### Single Responsibility

Each plugin should do ONE thing well:

- `metacognitive-guard` → Cognitive amplification + commit integrity + CI verification
- `feature-dev` → Guided feature development + code review

**Anti-pattern:** A plugin that handles CI, commits, AND reviews.

### Open/Closed

Plugins should be extensible without modification:

- Add new skills to extend behavior
- Use hooks for customization points
- Don't modify core plugin logic for edge cases

### Liskov Substitution

Skills must be interchangeable within their category:

- Any code-review skill should accept the same inputs
- Any commit skill should produce compatible outputs

### Interface Segregation

Don't force plugins to implement unused features:

- `hooks/` directory is optional
- `commands/` directory is optional
- Only require what's actually used

### Dependency Inversion

Plugins depend on abstractions (Skills), not concrete implementations:

- Skills define the contract
- Plugins orchestrate behavior through Skills
- Plugins orchestrate, never implement low-level operations

---

This file helps GitHub Copilot understand the conventions and structure of this repository. For detailed operational
instructions for Claude Code, see `CLAUDE.md`.
