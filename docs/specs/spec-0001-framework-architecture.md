---
status: accepted
contact: "Alexander Nachtmann"
date: "2025-11-21"
deciders: "Alexander Nachtmann"
consulted: "Anthropic Claude Code docs, Superpowers patterns, future contributors"
informed: "Users of ancplua-claude-plugins, CI maintainers, agent authors"
---

# Ancplua Claude Plugins Framework Specification

## Feature Name

ancplua-claude-plugins: Claude Code plugin marketplace, skills library, and agent lab.

## 1. Goal of this framework

This framework defines a single, long-lived repository that:

- Hosts multiple Claude Code plugins in a **consistent marketplace layout**.
- Provides **reusable Skills** that encode development discipline and workflows.
- Exposes **agents** inside plugins that orchestrate workflows and specialized analysis.
- Supplies **tooling and CI** so Claude and humans can safely evolve the system.

The goal is to keep Claude Code work **centralized, predictable, and inspectable** over many years without repeated
restructurings.

### Success Metric

This framework is successful when:

- At least one plugin (for example `metacognitive-guard`) can be:
  - Installed via marketplace from this repo.
  - Validated via `claude plugin validate`.
- New plugins and agents can be added **without changing** the top-level architecture.
- CI and `tooling/scripts/weave-validate.sh` run without unexpected errors after structural changes.
- Claude can follow `CLAUDE.md` to:
  - Refactor the repo.
  - Add or update plugins.
  - Adjust documentation, SPEC, ADR, and CHANGELOG entries autonomously.

### Outcome (implementation-free description)

Users and Claude Code obtain:

- A **single marketplace** (`.claude-plugin/marketplace.json`) that declares all plugins.
- A **stable directory layout** (`plugins/`, `tooling/`, `docs/`) that MUST be preserved.
- A set of **Skills and scripts** that guide how to:
  - Implement features.
  - Enforce CI discipline.
  - Maintain documentation and change history (including `CHANGELOG.md`, `spec.md`, `adr.md`).

Claude treats this repository as the **canonical home** for Alexander’s Claude ecosystem.

## 2. Problem being solved

### Current difficulties without this framework

Without a structured framework:

- Plugins, Skills, and experiments fragment into multiple repositories.
- Each new idea risks a new ad-hoc layout, making it hard for Claude to:
  - Discover existing functions, Skills, and scripts.
  - Safely refactor without breaking hidden assumptions.
- CI and validation rules are duplicated or inconsistent.
- Large refactors require humans to manually design new layouts.

### Pain points

This framework removes:

- **Ambiguous plugin boundaries**: no more “where does this Skill belong?”.
- **Unclear responsibilities**: plugins vs agents vs repo-level Skills are explicitly separated.
- **Inconsistent validation**: CI configuration and `weave-validate.sh` define one verification spine.

### System complexity issues

Without a consistent architecture:

- Claude must guess where to add new code.
- Knowledge is scattered across many small repos.
- It becomes difficult to treat Claude as an autonomous maintainer because the “rules of the world” are unclear.

This specification removes guesswork and gives Claude a stable **operating system for plugins**.

## 3. API and structure changes

The term “API” here covers:

- Marketplace manifest format.
- Plugin manifest expectations.
- Repository layout conventions that Claude and humans rely on.

If MCP tools are involved, document both the Claude Code usage (Skills/commands) and the MCP tool calls (inputs/outputs)
as users will see them.

### 3.1 Marketplace API

**File:** `.claude-plugin/marketplace.json`

The marketplace manifest MUST:

- Live at `.claude-plugin/marketplace.json` in the repo root.
- Have the following top-level fields:

```jsonc
{
  "name": "ancplua-claude-plugins",
  "owner": {
    "name": "AncpLua",
    "url": "https://github.com/ANcpLua"
  },
  "description": "Alexander's lifetime Claude Code ecosystem.",
  "plugins": [
    {
      "name": "metacognitive-guard",
      "source": "./plugins/metacognitive-guard",
      "description": "Cognitive amplification stack: epistemic hooks, competitive review, commit integrity, CI verification.",
      "version": "0.4.0"
    }
  ]
}
```

Rules:

- Every plugin under `plugins/` that is intended for use MUST have an entry in `plugins[]`.
- `source` MUST be a relative path to the plugin directory.
- `name` MUST match the plugin manifest `name`.
- `version` SHOULD match the plugin manifest `version`.

Claude MUST update this manifest whenever:

- A plugin is added, renamed, or removed.
- A plugin version is bumped.

### 3.2 Plugin API (manifest and layout)

Each plugin MUST live under:

```text
plugins/<plugin-name>/
  ├── .claude-plugin/
  │   └── plugin.json
  ├── skills/
  ├── commands/
  ├── hooks/
  ├── scripts/
  └── lib/
```

**Manifest requirements (`.claude-plugin/plugin.json`):**

- MUST contain:

  ```jsonc
  {
    "name": "metacognitive-guard",
    "description": "Cognitive amplification stack: epistemic hooks, competitive review, commit integrity, CI verification.",
    "version": "0.4.0",
    "author": {
      "name": "AncpLua",
      "url": "https://github.com/ANcpLua"
    },
    "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
    "license": "MIT"
  }
  ```

- MUST use a plain string for `repository`, not an object.

- MAY add `keywords`, `commands`, `hooks`, or MCP-related fields according to Anthropic plugin specs.

**Layout rules:**

- `skills/` MUST contain one subdirectory per Skill, each with `SKILL.md` and optional helpers.
- `commands/` MUST contain one file per slash command, using Anthropic’s command spec.
- `hooks/hooks.json` MUST define hooks only if needed and MUST NOT conflict with Superpowers or core workflows.
- `scripts/` MUST contain shell scripts used by Skills or plugins (e.g. `verify-local.sh`).
- `lib/` MAY contain JS/TS or other helper code for MCP servers or complex logic.

### 3.3 Repository layout API

At the top level, the repository MUST present:

- `plugins/` for plugins (each plugin contains its own `skills/`, `commands/`, `agents/` directories).
- `tooling/` for scripts and templates.
- `docs/` for architecture and process documentation.
- `.github/workflows` for CI and Dependabot.

Claude MUST maintain this shape when refactoring and MUST NOT introduce new top-level directories without updating:

- `docs/ARCHITECTURE.md`
- `spec.md`
- `adr.md` (if the change is a new architectural decision)

### 3.4 CHANGELOG integration

A root-level `CHANGELOG.md` MUST:

- Record significant user-facing changes to:

  - Plugins.
  - Agents.
  - Framework behavior (e.g. new validation steps, new Skills).
- Use chronological sections with versions and dates.

When Claude introduces or changes behavior that affects users, Claude MUST:

- Add or update an entry in `CHANGELOG.md`.
- Keep entries concise and factual.

## 4. E2E code and usage samples

Show how a developer uses the feature through Claude Code (Skills/commands) and, when MCP tools are part of the design,
how those tools are invoked and behave.

### 4.1 Add this repository as a marketplace (local clone)

```bash
cd /path/to/another/project
claude
```

In the Claude Code session:

```text
/plugin marketplace add /Users/ancplua/WebstormProjects/ancplua-claude-plugins
/plugin install metacognitive-guard@ancplua-claude-plugins
```

Expected outcome:

- Claude reads `.claude-plugin/marketplace.json`.
- `metacognitive-guard` plugin becomes available.
- The plugin's Skills and hooks can be used inside the target project.

### 4.2 Add this repository as a marketplace (GitHub)

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install metacognitive-guard@ancplua-claude-plugins
```

Claude MUST treat the GitHub repo as a marketplace using the same manifest.

### 4.3 Local validation before commit

From the root of this repo:

```bash
cd /Users/ancplua/WebstormProjects/ancplua-claude-plugins
./tooling/scripts/weave-validate.sh
```

Expected behavior:

- Validate marketplace and plugins with `claude plugin validate`.
- Run `shellcheck` on shell scripts (if installed).
- Run `markdownlint` on markdown files (if installed).
- Run `actionlint` on workflow files (if installed).

If a tool is missing, the script MUST log a clear warning and continue.

## 5. Maintenance rules for Claude

Claude MUST treat this file as a living specification:

- When adding new major capabilities (new plugin family, new agent category, new validation layer), Claude MUST:

  - Update the relevant sections in `spec.md`.
  - Update `date` to the current date.
  - Keep `status` consistent (e.g. switch to `accepted` when the design is in use).
- When the overall framework design changes significantly, Claude MUST:

  - Update `adr.md` with a new ADR or mark existing ADRs as `deprecated` or `superseded`.
  - Reflect those changes in this spec.

Claude MUST NOT:

- Remove historical context without replacing it with more accurate current context.
- Leave this spec outdated relative to the actual repository structure or behavior.

When in doubt, Claude MUST:

1. Inspect the current filesystem layout.
2. Compare it to this spec.
3. Align the repo with the spec or update the spec and ADR if the new design is intentional.
