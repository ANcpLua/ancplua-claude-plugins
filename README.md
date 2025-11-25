# ancplua-claude-plugins

**Alexander’s Claude Code plugin marketplace, skills library, and agent lab.**

This repository is a long-lived, structured home for:

- Claude Code **plugins** (commands, Skills, hooks, MCP servers)
- Claude Code **Skills** that encode development discipline
- Dedicated **agents** that use the Agent SDK
- Shared **tooling** and workflows for verification and CI
- A small internal **framework spec + ADR + changelog** that Claude must keep in sync

---

## At a glance

- Goal: Long-lived Claude Code marketplace and lab with consistent structure.
- Audience: Humans and Claude Code operating with local permissions.
- Entry points:
  - Operational spec: `CLAUDE.md`
  - Spec template: `docs/specs/spec-template.md`
  - ADR template: `docs/decisions/adr-template.md`
  - Change history: `CHANGELOG.md`
- Validate locally: `./tooling/scripts/local-validate.sh`

Design goals:

- One repository, many plugins
- Explicit, documented architecture
- Minimal hidden rules
- Everything Claude needs is in the repo

---

## 1. Repository roles

This repository has three primary roles:

1. **Marketplace**

    - Root-level `.claude-plugin/marketplace.json` describes available plugins.
    - Each plugin lives under `plugins/<plugin-name>/`.
    - You can add this repository as a marketplace and install plugins into any project.

2. **Claude Code workbench**

    - `CLAUDE.md` defines how Claude must behave when working inside this repo.
    - `docs/specs/spec-template.md` defines the framework’s goals, “API”, and success criteria.
    - `docs/decisions/adr-template.md` records architectural decisions and their status.
    - `CHANGELOG.md` records user-facing changes over time.
    - `skills/` and `plugins/**/skills/` provide first-class Skills that Claude can invoke.

3. **Agent / SDK lab**

    - `agents/` is reserved for Agent SDK–based agents that consume plugins and Skills.
    - Example: `repo-reviewer-agent` autonomously analyzes repository health.

---

## 2. Target layout (high level)

The repository layout is intentionally regular:

```text
ancplua-claude-plugins/
├── CLAUDE.md
├── README.md
│
├── CHANGELOG.md
│
├── .claude-plugin/
│   └── marketplace.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── dependabot.yml
│
├── docs/
│   ├── specs/
│   │   └── spec-template.md
│   ├── decisions/
│   │   └── adr-template.md
│   ├── ARCHITECTURE.md
│   ├── PLUGINS.md
│   ├── AGENTS.md
│   ├── WORKFLOWS.md
│   ├── RequirementsForAI.md
│   └── RequirementsForHumans.md
│
├── plugins/
│   ├── autonomous-ci/
│   │   ├── README.md
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── skills/
│   │   │   └── autonomous-ci/
│   │   │       └── SKILL.md
│   │   ├── commands/
│   │   ├── hooks/
│   │   │   └── hooks.json
│   │   ├── scripts/
│   │   │   ├── verify-local.sh
│   │   │   └── wait-for-ci.sh
│   │   └── lib/
│   │
│   ├── smart-commit/
│   │   ├── README.md
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── skills/smart-commit/SKILL.md
│   │   └── commands/commit.md
│   │
│   └── code-review/
│       ├── README.md
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── skills/code-review/SKILL.md
│       └── commands/review.md
│
├── agents/
│   └── repo-reviewer-agent/
│       ├── README.md
│       └── config/agent.json
│
├── skills/
│   └── working-on-ancplua-plugins/
│       ├── SKILL.md
│       └── references/
│           ├── conventions.md
│           ├── testing.md
│           └── publishing.md
│
└── tooling/
    ├── scripts/
    │   ├── sync-marketplace.sh
    │   └── local-validate.sh
    └── templates/
        └── plugin-template/
            ├── README.md
            ├── .claude-plugin/
            │   └── plugin.json
            ├── skills/
            │   └── example-skill/
            │       └── SKILL.md
            ├── commands/
            │   └── example-command.md
            └── hooks/
                └── hooks.json
```

If the filesystem differs from this, `CLAUDE.md`, `docs/specs/spec-template.md`, and `docs/decisions/adr-template.md`
define how Claude must migrate towards this structure.

### MCP servers (optional)

Plugins **may** ship an MCP server to expose tools (for example, filesystem helpers, CI APIs, or other integrations).
When a plugin uses MCP, the files stay inside that plugin directory:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── mcp/ or lib/
│   └── server.(ts|js|py|…)
├── skills/
├── commands/
├── hooks/
└── scripts/
```

`.mcp.json` declares the MCP server so Claude Code (or other MCP hosts) can load its tools. The plugin manifest
`.claude-plugin/plugin.json` still governs Skills, commands, and hooks—separate from MCP.

---

## 3. Using this repo with Claude Code

### 3.1 As a project you are actively editing

When you run Claude Code **inside** this repo:

1. Change into the repository root:

   ```bash
   cd /Users/ancplua/WebstormProjects/ancplua-claude-plugins
   claude
   ```

2. Claude will:

    - Read `CLAUDE.md` and treat it as the operational spec.
    - Read `docs/specs/spec-template.md` and `docs/decisions/adr-template.md` as needed for framework rules and
      decisions.
    - Use repo-specific Skills (for example, `working-on-ancplua-plugins`) when appropriate.

3. Before you commit:

   ```bash
   ./tooling/scripts/local-validate.sh
   ```

   This script is expected to run, at minimum:

    - `claude plugin validate` on the marketplace and plugins
    - `shellcheck` on shell scripts
    - `markdownlint` on Markdown files
    - `actionlint` on GitHub workflow files

   The exact behavior is defined in `tooling/scripts/local-validate.sh`.

### 3.2 As a plugin marketplace for other projects

You can install plugins from this repo into any Claude Code project.

**Add the marketplace (local path):**

```bash
cd /path/to/your/other/project
claude
/plugin marketplace add /Users/ancplua/WebstormProjects/ancplua-claude-plugins
```

**Or add the marketplace (GitHub repo):**

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
```

Claude will discover `.claude-plugin/marketplace.json` and register the listed plugins.

**Install a plugin:**

```text
/plugin install autonomous-ci@ancplua-claude-plugins
```

After installation, the plugin’s Skills, commands, hooks, and MCP servers become available in that project (according to
the plugin manifest and your Claude Code settings).

---

## 4. Current plugins

This section describes the intended responsibilities of the initial plugins. The exact implementation lives under
`plugins/`.

### 4.1 `autonomous-ci`

**Goal:** Enforce strict verification discipline:

- No “done” without:

  - Passing local tests
  - Passing CI for the current commit

**Components:**

- `skills/autonomous-ci/SKILL.md`
  Defines the CI verification protocol:

  - Run local tests.
  - Commit and push only after local success.
  - Monitor CI for the new commit.
  - Treat CI failures as mandatory rework, not optional noise.

- `scripts/verify-local.sh`

  - Generic local test runner (e.g. `dotnet test`, `npm test`, `pytest`, `go test`).
  - Must exit non-zero on failure.

- `scripts/wait-for-ci.sh`

  - CI monitoring script (implementation-specific).
  - Blocks until CI finishes for the target commit.
  - Must exit non-zero on CI failure.

- `hooks/hooks.json` (optional / additive)

  - Light-touch hooks that encourage or trigger CI-related checks.
  - Must not conflict with other plugin hooks such as Superpowers, if installed.

### 4.2 `smart-commit`

**Goal:** Generate semantic, conventional commit messages automatically.

**Components:**

- `skills/smart-commit/SKILL.md`: Skill for analyzing diffs and drafting messages.
- `commands/commit.md`: Slash command `/commit` to trigger the workflow.

### 4.3 `code-review`

**Goal:** Provide autonomous code review focusing on security, performance, and style.

**Components:**

- `skills/code-review/SKILL.md`: Skill for systematic code analysis.
- `commands/review.md`: Slash command `/review` to audit specific files or PRs.

---

## 5. Framework spec, ADR, and changelog

This repo has an explicit internal framework layer:

- `docs/specs/spec-template.md` – Framework specification

  - Status, contact, date, deciders, consulted, informed.
  - Overall goals, success metrics, and “API” of the marketplace structure.
  - Rules Claude must follow when evolving the repo.

- `docs/decisions/adr-template.md` – Architectural Decision Records(s)

  - ADR-0001: repository-as-marketplace architecture (and future ADRs).
  - Status per ADR: `proposed`, `accepted`, `rejected`, `deprecated`, or `superseded`.

- `CHANGELOG.md` – User-facing changes

  - Versioned, chronological history of plugin, agent, and framework changes.

Claude is required (per `CLAUDE.md`) to keep these files in sync with the actual state of the repo when making
structural or behavioral changes.

---

## 6. Preferred external docs for Claude

When Claude needs information about **Claude Code itself**, plugins, Skills, hooks, or the Agent SDK, it should:

1. Prefer **official docs**:

    - `https://code.claude.com/docs/en/*`

2. Then, if needed, consult:

    - `https://github.com/anthropics/claude-cookbooks`

3. Only after that, fall back to general web search.

If you (the human) explicitly provide a different URL (for example, a GitHub repo or blog post), Claude should inspect
that URL as requested, regardless of the above preference.

These are **preferences**, not hard limits.

---

## 7. Relationship to Superpowers and other frameworks

This repository is designed to **complement** rather than replace first-party Skill sets such as **Superpowers**:

- You may install Superpowers as a separate marketplace / plugin.
- This repo’s plugins and Skills are designed to:

  - Layer additional discipline (for example, CI verification) on top of Superpowers workflows.
  - Avoid overriding or fighting with Superpowers hooks and Skills.
  - Provide Anthropic-aligned, explicit, and inspectable behavior.

When both are installed:

- Use Superpowers for planning, debugging, and general development workflows.
- Use plugins from this repo (for example, `autonomous-ci`) to enforce verification, CI discipline, and
  repository-specific rules.

---

## 8. Development workflow (for humans)

### 8.1 Before large structural changes

- Read `CLAUDE.md`, `spec.md`, and `docs/decisions/adr-template.md` to understand the current rules.
- Skim `docs/ARCHITECTURE.md` for layout expectations.

### 8.2 Before any commit

1. Run the local validation script:

   ```bash
   ./tooling/scripts/local-validate.sh
   ```

2. Review changes:

   ```bash
   git status
   git diff
   ```

3. Use meaningful, structured commit messages (for example, conventional commits or another convention documented in
   `docs/WORKFLOWS.md`).

### 8.3 When adding a new plugin

High-level process (detailed version should live in `docs/PLUGINS.md`):

1. Create `plugins/<plugin-name>/`.

2. Add `.claude-plugin/plugin.json` with:

    - `name`
    - `version`
    - `description`
    - `author`
    - `repository`
    - `license`

3. Add any of:

    - `skills/<skill-name>/SKILL.md`
    - `commands/*.md`
    - `hooks/hooks.json`
    - `scripts/*.sh`, `lib/` sources, `.mcp.json` for MCP servers

4. Update `.claude-plugin/marketplace.json` or run `tooling/scripts/sync-marketplace.sh` (when implemented).

5. Update `CHANGELOG.md` if this is a user-visible feature.

6. Run `./tooling/scripts/local-validate.sh`.

---

## 9. License

Unless specified otherwise in a subdirectory:

- Code, configuration, and documentation in this repository are intended to be licensed under a permissive license such
  as **MIT**.
- The exact license terms must be defined in a `LICENSE` file at the repository root.

Until a `LICENSE` file exists, treat this repository as **private** and do not redistribute content without the author’s
permission.

### Documentation

Key docs live under `docs/`:

- `docs/ARCHITECTURE.md` – high-level repo architecture
- `docs/PLUGINS.md` – how to create and evolve plugins
- `docs/AGENTS.md` – Agent SDK usage and agents
- `docs/WORKFLOWS.md` – CI and local workflows
- `docs/specs/` – feature and framework specifications
  - `docs/specs/spec-template.md` – canonical spec template
- `docs/decisions/` – Architecture Decision Records
  - `docs/decisions/adr-template.md` – ADR template and initial ADR(s)
