---
location: "/Users/ancplua/WebstormProjects/ancplua-claude-plugins"
permissions: "Full (--dangerously-skip-permissions)"
mission: "Transform this repo into the target architecture. Execute completely. Don't ask, don't wait, just do."
---

# Repository Execution Plan

If you need information about Claude Code, plugins, Skills, hooks, or the Agent SDK:

```text
1. First use WebFetch/WebSearch on `https://code.claude.com/docs/en/*`.
2. If needed, also consult `https://github.com/anthropics/claude-cookbooks`.
3. Only then fall back to generic web search.
```

- If the user gives you a specific GitHub URL or other link, ALWAYS inspect it
  as requested, regardless of the above preference.

---

## Phase 0: Bootstrap

1. Run:

    - `pwd`
    - `ls -la`
    - `git status --short`
2. Structure overview:

    - `tree -L 3 || ls -R`
3. Read `CLAUDE.md` (that file is your high-level spec for how to work in this repo).
4. Use `TodoWrite` to create ONE todo per PHASE (0–12).
5. Mark each todo `in_progress` as you start a phase, and `completed` when you finish.

---

## Phase 1: Directory structure

Create the core layout if missing:

```bash
mkdir -p .claude-plugin
mkdir -p docs
mkdir -p plugins
mkdir -p agents
mkdir -p skills/working-on-ancplua-plugins/references
mkdir -p tooling/scripts
mkdir -p tooling/templates/plugin-template/{.claude-plugin,skills,commands,hooks,scripts}
```

If any directories already exist, keep them and move on.

---

## Phase 2: Migrate existing plugin

Move the existing `autonomous-ci-verification` directory into the `plugins/` layout:

```bash
git mv autonomous-ci-verification plugins/autonomous-ci
mkdir -p plugins/autonomous-ci/.claude-plugin
mkdir -p plugins/autonomous-ci/commands
mkdir -p plugins/autonomous-ci/hooks
```

Map existing content:

- Old `autonomous-ci-verification/README.md` → `plugins/autonomous-ci/README.md`
- Old `autonomous-ci-verification/scripts/` → `plugins/autonomous-ci/scripts/`
- Old `autonomous-ci-verification/skills/` → contents moved under `plugins/autonomous-ci/skills/autonomous-ci/`

Do not delete any content; move or rename instead.

---

## Phase 3: Stub placeholder plugins

For `wip-plugin-2` and `wip-plugin-3`:

1. Move into `plugins/`:

```bash
git mv wip-plugin-2 plugins/wip-plugin-2
git mv wip-plugin-3 plugins/wip-plugin-3
```

1. For each (`plugins/wip-plugin-2`, `plugins/wip-plugin-3`):

   Ensure structure:

   ```bash
   mkdir -p plugins/wip-plugin-2/.claude-plugin
   mkdir -p plugins/wip-plugin-2/skills
   mkdir -p plugins/wip-plugin-2/commands
   mkdir -p plugins/wip-plugin-2/hooks
   mkdir -p plugins/wip-plugin-2/scripts

   mkdir -p plugins/wip-plugin-3/.claude-plugin
   mkdir -p plugins/wip-plugin-3/skills
   mkdir -p plugins/wip-plugin-3/commands
   mkdir -p plugins/wip-plugin-3/hooks
   mkdir -p plugins/wip-plugin-3/scripts
   ```

   Add `README.md` if missing:

    - State clearly that it is a placeholder for a future plugin.
    - State that behavior and API are not defined yet.

   Add `.claude-plugin/plugin.json` with a minimal manifest:

   ```jsonc
   {
     "name": "future-plugin-2",
     "description": "Planned plugin. Placeholder structure only.",
     "version": "0.0.1",
     "author": {
       "name": "AncpLua",
       "url": "https://github.com/ANcpLua"
     },
     "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
     "license": "MIT"
   }
   ```

   And similarly for `future-plugin-3` (adjust `name` and `description`).

---

## Phase 4: Manifests

Create or overwrite `.claude-plugin/marketplace.json`:

```jsonc
{
  "name": "ancplua-claude-plugins",
  "owner": {
    "name": "AncpLua",
    "url": "https://github.com/ANcpLua"
  },
  "description": "Alexander's lifetime Claude Code ecosystem (plugins, skills, and agents).",
  "plugins": [
    {
      "name": "autonomous-ci",
      "source": "./plugins/autonomous-ci",
      "description": "Never claim completion without local tests and CI verification.",
      "version": "0.1.0"
    },
    {
      "name": "future-plugin-2",
      "source": "./plugins/wip-plugin-2",
      "description": "Planned plugin based on wip-plugin-2.",
      "version": "0.0.1"
    },
    {
      "name": "future-plugin-3",
      "source": "./plugins/wip-plugin-3",
      "description": "Planned plugin based on wip-plugin-3.",
      "version": "0.0.1"
    }
  ]
}
```

Create `plugins/autonomous-ci/.claude-plugin/plugin.json`:

```jsonc
{
  "name": "autonomous-ci",
  "description": "Ensures Claude verifies local tests AND CI before claiming completion.",
  "version": "0.1.0",
  "author": {
    "name": "AncpLua",
    "url": "https://github.com/ANcpLua"
  },
  "repository": "https://github.com/ANcpLua/ancplua-claude-plugins",
  "keywords": [
    "ci",
    "verification",
    "testing",
    "github-actions",
    "quality"
  ],
  "license": "MIT"
}
```

If any of these files already exist, merge content without losing existing fields that still make sense.

---

## Phase 5: Documentation

Create or update these docs:

1. `docs/ARCHITECTURE.md`:

    - Explain that this repo is:

        - A Claude Code marketplace
        - A plugin collection
        - A lab for agents and future experiments

    - Document the high-level structure (aligned with `CLAUDE.md` and `README.md`).

    - Clarify roles of:

        - `plugins/`
        - `agents/`
        - `skills/`
        - `tooling/`
        - `.claude-plugin/marketplace.json`

2. `docs/PLUGINS.md`:

    - How to create a new plugin under `plugins/`.

    - Required structure:

        - `.claude-plugin/plugin.json`
        - optional `skills/`, `commands/`, `hooks/`, `scripts/`, `lib/`

    - How to:

        - Add it to `marketplace.json`
        - Validate with `claude plugin validate`

    - Reference `tooling/templates/plugin-template/` as a starting point.

3. `docs/AGENTS.md`:

    - Describe the idea of `agents/` (Agent SDK–based agents).

    - Explain how agents:

        - Consume plugins from this marketplace
        - Use Skills from `skills/` and `plugins/**/skills/`

    - List initial planned agents (e.g. `repo-reviewer-agent`, `ci-guardian-agent`).

4. `docs/WORKFLOWS.md`:

    - Explain CI workflows (summary of `.github/workflows/ci.yml`).
    - Show how to run the same checks locally via `tooling/scripts/local-validate.sh`.
    - Include a short “pre-commit checklist”.

5. `docs/FUTURE.md`:

    - List planned features, experiments, and extension points.
    - State that this repo is a long-term lab and that ideas may appear here before becoming stable.

Use concise, unambiguous language. Avoid vague phrases like “should be fine”; be explicit.

---

## Phase 6: Repo-level Skill

Create `skills/working-on-ancplua-plugins/SKILL.md` with content similar to:

- When to use:

  - “Use this Skill whenever you are working on this repo.”

- Protocol:

  - Read `CLAUDE.md`.
  - Read `docs/ARCHITECTURE.md`.
  - Use `TodoWrite` to plan.
  - Execute changes using filesystem + plugin tools.
  - Run `tooling/scripts/local-validate.sh` before claiming completion.

- Emphasize:

  - Marketplace model
  - Small, composable plugins
  - Validation before “done”

Create reference docs:

- `skills/working-on-ancplua-plugins/references/conventions.md`:

  - Naming conventions
  - Directory layout rules
  - Git / branching expectations (if any)

- `skills/working-on-ancplua-plugins/references/testing.md`:

  - How to test plugins
  - Expected validation commands
  - Relationship to CI

- `skills/working-on-ancplua-plugins/references/publishing.md`:

  - How to:

    - Update `.claude-plugin/marketplace.json`
    - Tag versions in plugin manifests
    - Communicate changes via `README` or release notes

---

## Phase 7: Tooling

Create `tooling/scripts/sync-marketplace.sh` with a clear TODO stub:

```bash
#!/usr/bin/env bash
set -euo pipefail

# TODO: Implement marketplace.json regeneration from ./plugins contents.
# This script is currently a placeholder. It will eventually:
# - Enumerate plugins/* directories
# - Read each .claude-plugin/plugin.json (for example via jq)
# - Regenerate .claude-plugin/marketplace.json in a consistent format

echo "sync-marketplace.sh not yet implemented. Update .claude-plugin/marketplace.json manually for now."
```

Create `tooling/scripts/local-validate.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Running local CI validation..."

# Validate marketplace and plugins
if command -v claude >/dev/null 2>&1; then
  claude plugin validate .
  for d in plugins/*; do
    if [ -d "$d" ]; then
      claude plugin validate "$d"
    fi
  done
else
  echo "⚠️ 'claude' CLI not found. Skipping plugin validation."
fi

# Shell scripts
if command -v shellcheck >/dev/null 2>&1; then
  shopt -s globstar nullglob || true
  shellcheck plugins/**/scripts/*.sh tooling/scripts/*.sh
else
  echo "⚠️ 'shellcheck' not found. Skipping shell script checks."
fi

# Markdown
if command -v markdownlint >/dev/null 2>&1; then
  markdownlint "**/*.md"
else
  echo "⚠️ 'markdownlint' not found. Skipping markdown checks."
fi

# GitHub Actions workflows
if command -v actionlint >/dev/null 2>&1; then
  if [ -d ".github/workflows" ]; then
    actionlint .github/workflows/*.yml
  fi
else
  echo "⚠️ 'actionlint' not found. Skipping workflow syntax checks."
fi

echo "✅ Local validation script finished (some checks may have been skipped if tools were missing)."
```

Finally:

```bash
chmod +x tooling/scripts/*.sh
```

---

## Phase 8: Update .gitignore

Ensure `.gitignore` at the repo root contains at least:

```gitignore
# Node / TypeScript
node_modules/
dist/
coverage/
*.log
.env
.env.local

# Python
__pycache__/
*.pyc
.pytest_cache/
venv/
.venv/

# Build artifacts (generic)
bin/
obj/
*.dll
*.exe

# IDE
.DS_Store
.vscode/
*.swp
*.swo

# Claude Code
.claude-cache/
```

Do NOT add `.idea/` here unless you explicitly decide to ignore JetBrains project files.

---

## Phase 9: CI workflows

If `.github/workflows` does not exist, create it:

```bash
mkdir -p .github/workflows
```

If `.github/workflows/ci.yml` does not exist, create a CI workflow that includes jobs such as:

- `plugin-validation`:

  - Runs `claude plugin validate .` and per-plugin.

- `shell-scripts`:

  - Runs `shellcheck` on shell scripts.

- `markdown`:

  - Runs `markdownlint` on markdown files.

- `workflow-syntax`:

  - Runs `actionlint` on workflow YAMLs.

Optional additional jobs:

- `typescript-check` when TS projects exist.
- `dependency-review` on PRs.
- `codeql-analysis` for security.

If `ci.yml` already exists, extend or adjust it to include these checks where appropriate.

Ensure `.github/workflows/dependabot.yml` exists with at least:

- `github-actions` ecosystem for `/`
- `npm` ecosystem for any current or future Node/TS projects

---

## Phase 10: Update CLAUDE.md and CHANGELOG.md

Append or update a section like this in `CLAUDE.md`:

```markdown
## 14. Completed Migrations

### 2025-11-21: Initial Marketplace Refactor ✅

Migrated from flat structure to marketplace architecture.

**Actions taken:**

- Created marketplace manifest (`.claude-plugin/marketplace.json`)
- Migrated `autonomous-ci-verification` → `plugins/autonomous-ci`
- Created `docs/` (ARCHITECTURE, PLUGINS, AGENTS, WORKFLOWS, FUTURE)
- Created repo-level Skill (`skills/working-on-ancplua-plugins`)
- Created tooling scripts (`sync-marketplace.sh`, `local-validate.sh`)
- Updated CI workflows and Dependabot config
- Stubbed future plugins under `plugins/`

**Structure:**

- `plugins/autonomous-ci/` – CI verification plugin
- `plugins/wip-plugin-2/` – Placeholder for future plugin
- `plugins/wip-plugin-3/` – Placeholder for future plugin
- `skills/working-on-ancplua-plugins/` – Repo workflow Skill
- `tooling/` – Validation and template scripts

**Next steps:**

- Test marketplace:
    - `/plugin marketplace add ./`
    - `/plugin install autonomous-ci@ancplua-claude-plugins`
- Run local validation:
    - `./tooling/scripts/local-validate.sh`
- Commit and push changes when satisfied.
```

Create or update root `CHANGELOG.md` to record this migration. If it does not exist, create it with content similar to:

```markdown
# Changelog

## [Unreleased]

## [0.1.0] - 2025-11-21

### Added

- Initial migration to Claude Code plugin marketplace architecture.
- Added `.claude-plugin/marketplace.json`.
- Migrated `autonomous-ci-verification` to `plugins/autonomous-ci`.
- Added core docs, repo-level Skill, and validation tooling.
```

If `CHANGELOG.md` already exists, add an entry for version `0.1.0` that clearly describes this migration.

---

## Phase 11: Validation

Run the local validation script:

```bash
./tooling/scripts/local-validate.sh
```

If any check fails:

1. Inspect the error output.
2. Fix the underlying issues (scripts, markdown, workflows, manifests).
3. Re-run `./tooling/scripts/local-validate.sh` until it completes without unexpected errors.

---

## Phase 12: Report

Generate a final report for the user:

1. Show working directory and status:

   ```bash
   pwd
   git status --porcelain
   ```

2. Show a concise tree (or recursive listing):

   ```bash
   tree -L 2 -I '.git|node_modules' || ls -R
   ```

3. In your final response, list:

    - All **new files** created.
    - All **moved/renamed files**.
    - Any **validation warnings or errors** that remain (if any).

4. Provide exact commands for the user to follow:

   ```bash
   # Review changes
   git status
   git diff

   # Test marketplace in Claude Code
   claude
   > /plugin marketplace add /Users/ancplua/WebstormProjects/ancplua-claude-plugins
   > /plugin install autonomous-ci@ancplua-claude-plugins

   # Run validation
   ./tooling/scripts/local-validate.sh

   # Commit (when ready)
   git add .
   git commit -m "refactor: migrate to marketplace architecture

   - Move autonomous-ci-verification → plugins/autonomous-ci
   - Add marketplace manifest and plugin manifests
   - Create docs (ARCHITECTURE, PLUGINS, AGENTS, WORKFLOWS, FUTURE)
   - Add repo-level Skill: working-on-ancplua-plugins
   - Add tooling scripts for validation and sync
   - Update .gitignore for multi-language support"

   # Push (when ready)
   git push origin main
   ```

---

## Execution rules

- Work through EVERY phase (0–12) sequentially.
- Use `TodoWrite` to track one todo per phase.
- Do not skip steps to “save time”.
- If a file already exists and is correct, mark that part done and move on.
- If you encounter blockers, fix them and continue.
- Run validation after the major structural phases and at the end.
- Never hide failures; always show errors and how you handled them.

DONE means: all phases completed, validation script run, and a clear final report produced.

GO.
