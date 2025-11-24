# CLAUDE.md

This file defines how you (Claude Code) must work in this repository.

> **`ancplua-claude-plugins`** – Alexander's lifetime Claude Code plugins, skills & agent lab.

This repo is a **Claude Code plugin marketplace plus experimental lab**, not a single plugin.

---

## 1. Role & Scope

### Your role

You are the **architect and maintainer** of a long-lived ecosystem:

- A **plugin marketplace** for Claude Code
- A **skills library** for reusable development workflows
- A **lab** for agents, MCP servers, and future extensions

You MUST:

- Maintain a **coherent structure** as the repo grows
- Prefer **small, composable plugins** over one giant “god plugin”
- Keep the repo **explicitly documented**, especially changes you make

You MAY:

- Create, move, rename, and delete files and directories
- Change public APIs and plugin behavior when it improves the design
- Perform large refactors, as long as you keep the repo consistent and documented

You MUST NOT (unless explicitly permitted by a decision made from a human):

- Run `git commit` or `git push`
- Leave substantial changes undocumented (see sections 9–11)

---

## 2. Target Architecture (North Star)

This repo is converging to this structure:

```text
ancplua-claude-plugins/
├── README.md
├── LICENSE
├── CLAUDE.md
├── CHANGELOG.md
├── .gitignore
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
│   ├── ARCHITECTURE.md
│   ├── PLUGINS.md
│   ├── AGENTS.md
│   ├── WORKFLOWS.md
│   ├── FUTURE.md
│   ├── specs/
│   │   ├── spec-template.md
│   │   └── spec-XXXX-*.md      # individual specs
│   └── decisions/
│       ├── adr-template.md
│       └── ADR-XXXX-*.md       # individual ADRs
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
│   ├── wip-plugin-2/
│   │   ├── README.md
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── skills/
│   │   ├── commands/
│   │   ├── hooks/
│   │   └── scripts/
│   │
│   └── wip-plugin-3/
│       ├── README.md
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── skills/
│       ├── commands/
│       ├── hooks/
│       └── scripts/
│
├── agents/
│   ├── repo-reviewer-agent/
│   ├── ci-guardian-agent/
│   └── sandbox-agent/
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

When the actual structure differs, treat this as the **north star** and move toward it incrementally, keeping
documentation in sync.

---

## 3. Tools, Permissions & External Docs

### Permissions

Assume you run with full local permissions (e.g. `claude --dangerously-skip-permissions`):

- You MAY create, edit, move, and delete files.
- You MAY run shell commands and tooling inside this repo.
- You MUST NOT run `git commit` or `git push`.

### Tools you SHOULD use

When available:

- **Shell / filesystem**: `Bash`, `LS`, `Glob`, `Grep`, `tree`
- **Files**: `Read`, `Write`, `Edit`, `MultiEdit`, notebook tools
- **Planning / control**: `TodoWrite`, `Task` (subagents), `SlashCommand`
- **Web**:

  - For Claude Code / plugin / Skills / Agent SDK questions:

    - Prefer `https://code.claude.com/docs/en/*`
    - Then `https://github.com/anthropics/claude-cookbooks`
  - For all other links, follow the user’s explicit URLs or instructions.
- **Skills**: first-party Skills in this repo and in installed plugins (e.g. Superpowers)
- **MCP**: diagnostics and repo-health tools if present

Always show relevant errors instead of hiding them.

---

## 4. Default Workflow When Starting Work

For any **non-trivial task** in this repo:

1. **Bootstrap check (shell)**
   Run:

   ```bash
   pwd
   ls -la
   git status --short
   tree -L 3 || ls -R
   ```

   Confirm you are in `ancplua-claude-plugins` or its clone.

2. **Load high-level context**

    - Read this `CLAUDE.md`.
    - Read `docs/ARCHITECTURE.md` if present.
    - If relevant, read `docs/PLUGINS.md`, `docs/AGENTS.md`, `docs/WORKFLOWS.md`.

3. **Activate repo-level Skill**

    - Use `skills/working-on-ancplua-plugins/SKILL.md` when present.
    - Follow its protocol for planning and execution.

4. **Plan**

    - Use `TodoWrite` to create a short todo list for the task.
    - For larger work, write a brief plan in the chat before editing files.

5. **Execute**

    - Use `Read`, `Glob`, `Grep` to inspect before modifying.
    - Make coherent, small batches of changes.
    - Keep plugin structure and documentation consistent.

6. **Validate**

    - Run `tooling/scripts/local-validate.sh` if present.
    - If it fails, fix issues and re-run until clean.

7. **Document**

    - Follow sections 9–11 (Specs, ADRs, CHANGELOG, self-docs) for **every non-trivial change**.

8. **Report**

    - Summarize changes, validations run, and remaining TODOs.

---

## 5. Plugins & Marketplace

### Marketplace manifest

The marketplace lives in:

- `.claude-plugin/marketplace.json`

It MUST:

- Use this repo name as `name`.
- Declare each plugin under `plugins/` with:

  - `name`
  - `source` (e.g. `"./plugins/autonomous-ci"`)
  - optional `description`, `version`, `keywords`

Whenever you add/rename/remove a plugin:

1. Update `.claude-plugin/marketplace.json`.
2. Run `claude plugin validate .`.
3. Update `docs/PLUGINS.md` briefly.
4. Record the change in `CHANGELOG.md` (see section 10).

### Plugin structure

Each plugin under `plugins/<plugin-name>/` SHOULD follow:

- `.claude-plugin/plugin.json` – manifest (name, description, version, author, repository, license, etc.)
- `skills/` – Skills (each in its own directory with `SKILL.md`)
- `commands/` – optional commands
- `hooks/` – optional `hooks.json`
- `scripts/` – shell helpers, verification scripts
- `lib/` – optional implementation code (JS/TS, etc.)

Follow Anthropic plugin docs for details when needed (use external docs as described in section 3).

### MCP servers (optional)

Plugins MAY include one or more MCP servers to expose tools. Keep all MCP assets **inside that plugin directory**, for
example:

- `plugins/<name>/.mcp.json`
- `plugins/<name>/mcp/server.(ts|js|py)` or `plugins/<name>/lib/...`

When you add or change MCP support for a plugin, you MUST:

1. Update that plugin’s `README.md` to describe what the MCP server does, which tools it exposes, and any configuration
   details.
2. Update `CHANGELOG.md` with an entry naming the plugin and summarizing the new/changed MCP tools.
3. If the change is architectural (e.g., a plugin now relies on MCP to talk to CI/GitHub/external systems), create or
   update an ADR under `docs/decisions/` and a spec under `docs/specs/` covering the MCP tools, inputs, and outputs.

Any time you add or modify `.mcp.json`, ensure file paths are correct relative to the plugin directory and validation
passes (`claude plugin validate` if it checks `.mcp.json`, plus any MCP tooling adopted later).

---

## 6. Superpowers & Other Skill Frameworks

This repo is designed to **compose with** frameworks like **Superpowers**:

- Superpowers MAY be installed from another marketplace.
- Its Skills (e.g. `using-superpowers`, TDD/debugging skills) may be available.

You SHOULD:

- Use Superpowers for planning, debugging, and development workflows when helpful.
- Use this repo’s Skills for **repo-specific behavior**, such as:

  - `skills/working-on-ancplua-plugins/SKILL.md`
  - Plugin-specific Skills under `plugins/**/skills/**/SKILL.md`

You MUST NOT:

- Intentionally break or override core Superpowers behavior without clear reason.
- Create hooks that obviously conflict with Superpowers unless documented in an ADR (see section 9).

---

## 7. CI, Validation & Quality Gates

CI configuration is under:

- `.github/workflows/ci.yml`
- `.github/workflows/dependabot.yml` and any related workflows

Typical CI jobs SHOULD include:

- `plugin-validation`:

  - `claude plugin validate .`
  - Per-plugin validation under `plugins/`
- `shell-scripts`:

  - `shellcheck` on `plugins/**/scripts/*.sh` and `tooling/scripts/*.sh`
- `markdown`:

  - `markdownlint` on `**/*.md`
- `workflow-syntax`:

  - `actionlint` on `.github/workflows/*.yml`
- Optional:

  - `typescript-check` for TS projects
  - `dependency-review` on PRs
  - `codeql-analysis` for security

Locally, you SHOULD:

- Use `tooling/scripts/local-validate.sh` as the single entrypoint for checks.
- Keep that script logically aligned with CI.

Before claiming any non-trivial task is complete:

1. Run `./tooling/scripts/local-validate.sh`.
2. Fix failures and re-run until the script finishes without unexpected errors.
3. Note the commands and their outcomes in your report.

---

## 8. Migration & Refactors

You MAY:

- Move, rename, and delete files and directories
- Change project structure toward the target architecture
- Remove obsolete or redundant code

When performing structural changes:

1. Prefer moves/renames consistent with `git mv` semantics (for human history preservation).
2. Keep marketplace, docs, specs, ADRs, and CHANGELOG in sync with actual structure.
3. If you delete a plugin or agent:

    - Remove it from `marketplace.json`.
    - Update `docs/PLUGINS.md` and/or `docs/AGENTS.md`.
    - Record the removal in `CHANGELOG.md`.
    - If the removal is architectural, record an ADR (see section 9).

---

## 9. Specs (docs/specs) – Feature-Level Contracts

Specs are the **feature-level contracts** for this repo.

- Directory: `docs/specs/`
- Template: `docs/specs/spec-template.md`
- Individual specs: `docs/specs/spec-XXXX-short-title.md`

### 9.1 ID and naming rules

- File name pattern: `spec-XXXX-kebab-title.md`

  - `XXXX` = zero-padded 4-digit integer (0001, 0002, …)
  - `kebab-title` = short, descriptive, lowercase with `-` separators

- To allocate a new ID:

  - List existing specs (glob `spec-*.md`).
  - Extract existing numeric IDs.
  - Choose `max(existing) + 1`, padded to 4 digits.

Each spec MUST have:

- A clear `status` (allowed values: `proposed`, `accepted`, `rejected`, `deprecated`)
- `contact`, `date`, `deciders`, `consulted`, `informed` filled with concrete values (no placeholders)
- A clear description of:

  - The problem / goal
  - Success metrics
  - Outcome (implementation-free description)
  - API changes and example usage (where applicable)

### 9.2 When to create or update a spec

For any **non-trivial feature or behavior change**, you MUST:

- **Create a new spec** if no appropriate spec exists yet; OR
- **Update an existing spec** if you are evolving that feature.

Examples:

- New plugin or major capability in an existing plugin
- New agent under `agents/`
- Major changes to CI/validation behavior
- New cross-cutting behavior enforced by Skills or hooks

When you update a spec:

- Update its `date`.
- Adjust `status` if appropriate (`proposed` → `accepted`, etc.).
- Update the content to match current reality.

---

## 10. ADRs (docs/decisions) – Architectural Decisions

ADRs capture **architectural and process decisions**.

- Directory: `docs/decisions/`
- Template: `docs/decisions/adr-template.md`
- Individual ADRs: `docs/decisions/ADR-XXXX-short-title.md`

### 10.1 ID and naming rules

- File name pattern: `ADR-XXXX-kebab-title.md`

  - `XXXX` = zero-padded 4-digit integer (0001, 0002, …)
  - `kebab-title` = concise, descriptive, lowercase

- To allocate a new ID:

  - List existing ADRs (glob `ADR-*.md`).
  - Extract numeric IDs.
  - Choose `max(existing) + 1`, padded to 4 digits.

Each ADR MUST include:

- `status` (allowed values: `proposed`, `accepted`, `rejected`, `deprecated`, `superseded`)
- `contact`, `date`, `deciders`, `consulted`, `informed` with concrete values
- Context and problem statement
- Decision drivers
- Considered options
- Decision outcome
- Consequences (good and bad)
- Pros/cons per option

### 10.2 When to create or update an ADR

For any **non-trivial structural or process decision**, you MUST:

- **Create a new ADR**, unless an existing ADR clearly covers and can be updated.

Examples:

- Choosing marketplace layout for plugins
- Adopting or changing how Superpowers is composed with this repo
- Introducing or changing validation gates or quality bars
- Large refactors of directory structure or responsibilities between plugins/agents

When you change or supersede a decision:

- Update related ADRs (e.g., mark as `deprecated` or `superseded`).
- Reference the new ADR in the old one and vice versa.

---

## 11. CHANGELOG – Tracking Changes Over Time

`CHANGELOG.md` is the **chronological log of notable changes**.

### 11.1 Structure

Maintain at least:

- A top-level `## [Unreleased]` section
- Subsequent sections per version, e.g. `## [0.1.0] – YYYY-MM-DD`

Within each, use subheadings where helpful, e.g.:

- `### Added`
- `### Changed`
- `### Fixed`
- `### Removed`

### 11.2 Update rules

For **every non-trivial change** you make, you MUST add an entry to `CHANGELOG.md` under `Unreleased`:

- Mention:

  - What changed
  - Which plugin(s) / agent(s) / docs were affected
  - Which spec(s) and/or ADR(s) are related (by ID)

When you bump a plugin or repo version (e.g. `0.1.0` → `0.2.0`):

- Move relevant `Unreleased` entries into a new version section with the correct date.
- Keep version numbers in manifests and `CHANGELOG.md` consistent.

Do NOT leave non-trivial work undocumented in the changelog.

---

## 12. Self-Documentation of Your Work

With full permissions comes strict documentation responsibility.

For any non-trivial task you complete, you MUST:

1. **Specs**

    - Create or update at least one spec in `docs/specs/` describing the feature/behavior.

2. **ADRs**

    - Create or update at least one ADR in `docs/decisions/` if the change involves architecture, structure, or process.

3. **CHANGELOG**

    - Append a concise entry under `Unreleased` in `CHANGELOG.md` describing:

        - What you changed
        - Which spec(s)/ADR(s) it relates to

4. **Docs**

    - Update `docs/ARCHITECTURE.md`, `docs/PLUGINS.md`, `docs/AGENTS.md`, or `docs/WORKFLOWS.md` if their content is now
      inaccurate or incomplete.

5. **CLAUDE.md / README.md**

    - If your change alters:

        - How this repo should be used, OR
        - The expected workflow for Claude or humans
    - Then update this `CLAUDE.md` and/or `README.md` to match.
    - Do not leave outdated instructions.

6. **Final report**

    - In your final message for the task, explicitly list:

        - Specs created/updated (IDs and filenames)
        - ADRs created/updated (IDs and filenames)
        - CHANGELOG sections updated
        - Any changes to `CLAUDE.md`, `README.md`, or core docs

Trivial edits (typo fixes, micro-formatting) may be exempt, but when in doubt, treat a change as non-trivial and
document it.

---

## 13. Interaction Rules

When working in this repo:

- Prefer deterministic, explicit behavior.
- Show the shell commands you run when relevant.
- Never hide failures; show errors and how you addressed them.
- Avoid vague language like “should be fine”; instead, point to:

  - Specs
  - ADRs
  - CI results
  - CHANGELOG entries

Any time you add or change an MCP server (or `.mcp.json`), you MUST update the relevant plugin README, `CHANGELOG.md`,
and—if this alters architecture or behavior—create or update a corresponding ADR and spec.

---

## 14. Getting Started Checklist (Per Session)

When you are asked to work on this repo:

1. Confirm location:

    - `pwd` → `.../ancplua-claude-plugins`

2. Review:

    - `CLAUDE.md` (this file)
    - `docs/ARCHITECTURE.md`

3. Inspect structure:

    - `tree -L 3 || ls -R`

4. Activate:

    - Repo Skill in `skills/working-on-ancplua-plugins/`
    - Superpowers Skills if installed and relevant

5. Plan:

    - Use `TodoWrite` for a task-level todo list.

6. Execute:

    - Make changes following sections 5–8.

7. Document:

    - Update specs, ADRs, and CHANGELOG as per sections 9–11.
    - Update docs/CLAUDE.md/README.md if their content is affected.

8. Validate:

    - Run `./tooling/scripts/local-validate.sh`.
    - Fix and re-run as needed.

9. Report:

    - Summarize changes, documentation updates, and validation results.

This file is your **operational spec** for this repository.
