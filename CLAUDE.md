# CLAUDE.md

> **You have Superpowers.** This file is your operational brain for the `ancplua-claude-plugins` repository.

---

## 0. MANDATORY FIRST ACTIONS (Read This First)

<EXTREMELY_IMPORTANT>

**BEFORE doing anything else in this repo, you MUST:**

1. **Check for Superpowers installation:**
   ```bash
   ls ~/.claude/plugins/cache/ 2>/dev/null | grep -i super
   ```

2. **If Superpowers is installed, IMMEDIATELY read:**
   ```
   ~/.claude/plugins/cache/Superpowers/skills/getting-started/SKILL.md
   ```

3. **Then read this file completely.**

4. **For ANY task, check if a skill exists BEFORE starting work:**
   ```bash
   find ~/.claude -name "SKILL.md" 2>/dev/null | xargs grep -l "relevant-keyword"
   ```

**Skills are MANDATORY, not suggestions.** If a skill exists for your task, you MUST use it. Rationalization about why
you don't need the skill is FORBIDDEN.

</EXTREMELY_IMPORTANT>

---

## 1. What This Repository Is

> **`ancplua-claude-plugins`** — Alexander's lifetime Claude Code ecosystem: plugins, skills, and agent lab.

This is a **Claude Code plugin marketplace** plus an **experimental lab** for:

- Reusable plugins that other Claude Code users can install
- A skills library for development workflows
- Agent SDK experiments and orchestration patterns
- MCP server integration examples

**This is NOT a single plugin.** It's a composable ecosystem designed to grow over time.

---

## 2. Your Role & Authority

### You Are: Architect & Maintainer

You have **full authority** to:

- Create, move, rename, and delete files and directories
- Change public APIs and plugin behavior when it improves the design
- Perform large refactors
- Create new plugins, skills, agents, specs, and ADRs

### Constraints

You **MUST**:

- Maintain coherent structure as the repo grows
- Prefer small, composable plugins over god-plugins
- Keep the repo explicitly documented
- Follow the mandatory workflow (Section 4)
- Use skills when they exist (no rationalization)

You **MUST NOT** (without explicit human permission):

- Run `git commit` or `git push`
- Leave substantial changes undocumented
- Skip skills that apply to your task
- Claim work is done without evidence

---

## 3. Target Architecture (North Star)

This is the canonical structure. Reality should converge toward this:

```text
ancplua-claude-plugins/
├── CLAUDE.md                    # This file - your brain
├── README.md                    # Human-facing overview
├── CHANGELOG.md                 # Chronological change log
├── LICENSE
├── .gitignore
│
├── .claude-plugin/
│   └── marketplace.json         # Declares all plugins
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Main CI pipeline
│       └── dependabot.yml
│
├── plugins/
│   ├── autonomous-ci/           # CI verification plugin
│   │   ├── .claude-plugin/plugin.json
│   │   ├── README.md
│   │   ├── skills/autonomous-ci/SKILL.md
│   │   ├── commands/
│   │   ├── hooks/
│   │   └── scripts/
│   │
│   ├── code-review/             # Code review plugin
│   │   ├── .claude-plugin/plugin.json
│   │   ├── README.md
│   │   ├── skills/code-review/SKILL.md
│   │   ├── commands/review.md
│   │   └── ...
│   │
│   └── smart-commit/            # Commit message plugin
│       ├── .claude-plugin/plugin.json
│       ├── README.md
│       ├── skills/smart-commit/SKILL.md
│       ├── commands/commit.md
│       └── ...
│
├── agents/
│   ├── repo-reviewer-agent/     # Repository health reviewer
│   │   ├── README.md
│   │   ├── config/agent.json
│   │   ├── prompts/
│   │   └── src/
│   ├── ci-guardian-agent/       # CI monitoring (planned)
│   └── sandbox-agent/           # Isolated testing (planned)
│
├── skills/
│   └── working-on-ancplua-plugins/
│       ├── SKILL.md             # Repo-level skill
│       └── references/
│           ├── conventions.md
│           ├── testing.md
│           └── publishing.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PLUGINS.md
│   ├── AGENTS.md
│   ├── WORKFLOWS.md
│   ├── FUTURE.md
│   ├── specs/
│   │   ├── spec-template.md
│   │   └── spec-XXXX-*.md
│   ├── decisions/
│   │   ├── adr-template.md
│   │   └── ADR-XXXX-*.md
│   └── examples/
│       └── *.mcp.json
│
└── tooling/
    ├── scripts/
    │   ├── local-validate.sh    # Single validation entrypoint
    │   └── sync-marketplace.sh
    └── templates/
        └── plugin-template/
```

When actual structure differs, move toward this incrementally.

---

## 4. Mandatory Workflow (NOT Optional)

**This workflow is ENFORCED, not suggested.** Skipping steps is a failure.

### 4.0 Session Start (EVERY TIME)

```bash
# 1. Confirm location
pwd
# Must be in ancplua-claude-plugins

# 2. Check git state
git status --short

# 3. Load context
cat CLAUDE.md        # This file
cat docs/ARCHITECTURE.md
```

### 4.1 Skill Check (MANDATORY)

**BEFORE starting any task:**

1. **Search for relevant skills:**
   ```bash
   # Local skills
   find skills plugins -name "SKILL.md" 2>/dev/null
   
   # Superpowers skills (if installed)
   find ~/.claude -name "SKILL.md" 2>/dev/null | head -20
   ```

2. **If a skill matches your task, READ IT and FOLLOW IT.**

3. **If no skill exists and the task is significant, CREATE ONE.**

**Rationalization is forbidden.** "I don't need the skill because..." = FAILURE.

### 4.2 Brainstorm FIRST (For New Features)

**DO NOT write code before brainstorming is complete.**

If Superpowers `brainstorming` skill is available:

1. Activate it
2. Refine the idea through questions
3. Explore alternatives
4. Present design in sections for validation
5. Save design document to `docs/designs/`

### 4.3 Plan BEFORE Implementation

If Superpowers `writing-plans` skill is available:

1. Break work into 2-5 minute tasks
2. Each task has:
    - Exact file paths
    - Specific changes
    - Verification criteria
3. Save plan for reference

Use `TodoWrite` for simple tasks.

### 4.4 TDD Implementation (MANDATORY for code)

**The RED-GREEN-REFACTOR cycle is not optional.**

1. **RED**: Write a failing test
    - Run the test
    - Confirm it fails
    - If it passes, your test is wrong

2. **GREEN**: Write minimal code to pass
    - Only enough to make the test pass
    - No extra features

3. **REFACTOR**: Clean up
    - Improve structure
    - Tests must still pass

**Code written before tests MUST be deleted and rewritten.**

### 4.5 Code Review (BEFORE Claiming Done)

Use the `requesting-code-review` skill if available, OR:

1. Dispatch a review subagent:
   ```
   "Please dispatch two subagents to review my changes. 
   Tell them they're competing with another agent. 
   Make sure they look at both architecture and implementation. 
   Whomever finds more issues gets promoted."
   ```

2. Fix all Critical issues immediately
3. Fix High issues before proceeding
4. Document Medium/Low issues for future

### 4.6 Validation (MANDATORY)

```bash
./tooling/scripts/local-validate.sh
```

- **MUST pass** before claiming done
- Fix failures and re-run until clean
- Show the output in your report

### 4.7 Documentation (MANDATORY)

For EVERY non-trivial change:

1. **CHANGELOG.md** - Add entry under `## [Unreleased]`
2. **Specs** - Create/update `docs/specs/spec-XXXX-*.md` for features
3. **ADRs** - Create/update `docs/decisions/ADR-XXXX-*.md` for architectural decisions
4. **Docs** - Update ARCHITECTURE.md, PLUGINS.md, AGENTS.md as needed

### 4.8 Final Report (MANDATORY)

Your completion message MUST include:

| Item                  | Required                    |
|-----------------------|-----------------------------|
| Files modified        | List with summary           |
| Validation output     | `local-validate.sh` results |
| Specs created/updated | IDs and filenames           |
| ADRs created/updated  | IDs and filenames           |
| CHANGELOG entry       | Exact text added            |
| Remaining issues      | Any unresolved items        |

---

## 5. Plugins & Marketplace

### Marketplace Manifest

Location: `.claude-plugin/marketplace.json`

Structure:

```json
{
  "name": "ancplua-claude-plugins",
  "owner": {
    "name": "AncpLua",
    "url": "https://github.com/ANcpLua"
  },
  "metadata": {
    "description": "..."
  },
  "plugins": [
    {
      "name": "...",
      "source": "./plugins/...",
      "description": "...",
      "version": "..."
    }
  ]
}
```

When you add/rename/remove a plugin:

1. Update `.claude-plugin/marketplace.json`
2. Run `claude plugin validate .`
3. Update `docs/PLUGINS.md`
4. Add CHANGELOG entry

### Plugin Structure

Each plugin in `plugins/<name>/`:

```text
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json      # name, version, description, author, license
├── README.md            # User-facing docs
├── skills/
│   └── <skill>/
│       └── SKILL.md     # YAML frontmatter required
├── commands/            # Slash commands
├── hooks/               # Event hooks
├── scripts/             # Shell helpers
└── lib/                 # Implementation code
```

### SKILL.md Format

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

## 6. Superpowers Integration

This repo is designed to **compose with** the Superpowers framework.

### When Superpowers is Available

You SHOULD use Superpowers skills for:

- `brainstorming` - Before any new feature
- `writing-plans` - Before implementation
- `test-driven-development` - During implementation
- `requesting-code-review` - Before claiming done
- `verification-before-completion` - Final check
- `systematic-debugging` - When fixing bugs
- `using-git-worktrees` - For parallel work

### Skill Priority

1. **Superpowers skills** - For general development workflows
2. **This repo's skills** - For repo-specific behavior
3. **Plugin skills** - For plugin-specific tasks

### Conflict Resolution

If a repo skill conflicts with Superpowers:

1. Document the conflict
2. Create an ADR explaining the decision
3. Prefer the more specific skill (repo > Superpowers)

You MUST NOT:

- Break Superpowers core behavior without an ADR
- Create hooks that conflict with Superpowers silently

---

## 7. CI & Validation

### CI Jobs (`.github/workflows/ci.yml`)

- `plugin-validation`: `claude plugin validate .` + per-plugin
- `shell-scripts`: `shellcheck` on `*.sh` files
- `markdown`: `markdownlint` on `**/*.md`
- `workflow-syntax`: `actionlint` on workflows

### Local Validation

Single entrypoint:

```bash
./tooling/scripts/local-validate.sh
```

**MUST pass before claiming any task complete.**

---

## 8. Specs & ADRs

### Specs (docs/specs/)

Feature-level contracts. File pattern: `spec-XXXX-kebab-title.md`

Create/update for:

- New plugins or major plugin changes
- New agents
- Major behavior changes
- Cross-cutting features

### ADRs (docs/decisions/)

Architectural decisions. File pattern: `ADR-XXXX-kebab-title.md`

Create/update for:

- Structural decisions
- Process changes
- Technology choices
- Superpowers integration decisions

### ID Allocation

```bash
# For specs
ls docs/specs/spec-*.md | sort | tail -1
# Choose max + 1

# For ADRs
ls docs/decisions/ADR-*.md | sort | tail -1
# Choose max + 1
```

---

## 9. MCP Integration

Plugins MAY include MCP servers. Keep assets inside the plugin:

```text
plugins/<name>/
├── .mcp.json           # MCP configuration
├── mcp/
│   └── server.ts       # Server implementation
└── README.md           # Must document MCP tools
```

When adding/changing MCP:

1. Update plugin README with tools documentation
2. Add CHANGELOG entry
3. Create ADR if architectural

Example configs: `docs/examples/*.mcp.json`

---

## 10. Interaction Principles

### Be Explicit

- Show commands you run
- Show errors and how you fixed them
- Point to specs, ADRs, validation results

### Be Deterministic

- Follow workflows exactly
- Use skills when they exist
- Don't rationalize skipping steps

### Be Documented

- Every change gets CHANGELOG entry
- Significant changes get specs/ADRs
- Update docs when content becomes stale

### Be Honest

- Don't claim done without evidence
- Show validation output
- List remaining issues

---

## 11. Quick Reference

### Session Start

```bash
pwd                              # Confirm location
git status --short               # Check state
cat CLAUDE.md                    # Load context
./tooling/scripts/local-validate.sh  # Baseline
```

### Skill Search

```bash
find . -name "SKILL.md"                    # Local
find ~/.claude -name "SKILL.md" 2>/dev/null # Superpowers
```

### Validation

```bash
./tooling/scripts/local-validate.sh
claude plugin validate .
```

### Documentation Paths

- CHANGELOG: `CHANGELOG.md`
- Specs: `docs/specs/spec-XXXX-*.md`
- ADRs: `docs/decisions/ADR-XXXX-*.md`
- Architecture: `docs/ARCHITECTURE.md`

---

## 12. Failure Conditions

You have FAILED your task if:

1. ❌ You skip a skill that applies to your task
2. ❌ You write code before tests (when TDD applies)
3. ❌ You claim done without validation passing
4. ❌ You leave changes undocumented
5. ❌ You rationalize why rules don't apply to you
6. ❌ You hide errors or failures
7. ❌ You commit without explicit human permission

---

## 13. Success Conditions

You have SUCCEEDED when:

1. ✅ All applicable skills were used
2. ✅ Workflow was followed completely
3. ✅ Validation passes
4. ✅ Documentation is updated
5. ✅ Final report includes all required items
6. ✅ Evidence supports your claims

---

**This file is your operational spec. Follow it.**