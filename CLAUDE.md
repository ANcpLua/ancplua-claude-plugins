# CLAUDE.md

> **You have Superpowers.** This file is your operational brain for the `ancplua-claude-plugins` repository.

---

## 0. MANDATORY FIRST ACTIONS (Read This First)

<EXTREMELY_IMPORTANT>

**BEFORE doing anything else in this repo, you MUST:**

1. **Read CHANGELOG.md:**

   ```text
   Read the file: CHANGELOG.md
   ```

   This tells you what has been done recently. Check the `[Unreleased]` section for pending work.
   This prevents duplicate work and enables intelligent task sequencing.

2. **If Superpowers is installed, read:** `~/.claude/plugins/cache/Superpowers/skills/getting-started/SKILL.md`

3. **Read this file completely.**

4. **Check for relevant skills before starting any task:**

   ```bash
   find ~/.claude -name "SKILL.md" 2>/dev/null | xargs grep -l "relevant-keyword"
   ```

**Skills are MANDATORY, not suggestions.** If a skill exists for your task, you MUST use it. Rationalization about why
you don't need the skill is FORBIDDEN.

</EXTREMELY_IMPORTANT>

---

## 1. What This Repository Is

> **`ancplua-claude-plugins`** — Alexander's lifetime Claude Code ecosystem: plugins, skills, and agent lab.

**Architectural Role: Type A (Application)**
This repository provides the **"Brain"** (Skills, Orchestration) that drives the **"Hands"** (MCP Tools) provided by
`ancplua-mcp` (Type T).

It is a **Claude Code plugin marketplace** plus an **experimental lab** for:

- Reusable plugins (Type A components)
- A skills library for development workflows
- Agent SDK experiments and orchestration patterns
- MCP configuration examples (consuming Type T servers)

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

You **ARE ALLOWED TO**:

- Run `git commit` or `git push`

You **NOT ALLOWED TO**:

- Leave substantial changes undocumented
- Skip skills that apply to your task
- Claim work is done without evidence

### Co-Agents

- **Gemini:** Senior Dev & Implementation Specialist (See `GEMINI.md` for operational specifics).

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
├── plugins/                     # 11 plugins
│   ├── autonomous-ci/           # CI verification and monitoring
│   ├── code-review/             # Security, style, performance analysis
│   ├── metacognitive-guard/     # Cognitive amplification stack (v0.2.6)
│   ├── otelwiki/                # OpenTelemetry documentation (v1.0.6)
│   ├── dotnet-architecture-lint/# .NET build pattern enforcement
│   ├── completion-integrity/    # Prevents task shortcuts
│   ├── workflow-tools/          # Multi-agent orchestration (v2.0.0)
│   ├── hookify/                 # User-configurable hooks
│   ├── feature-dev/             # Guided feature development
│   ├── ancplua-project-routing/ # Auto-routes to specialist agents
│   └── exodia/                  # Skills-standard workflow orchestration
│
├── agents/
│   ├── cleanup-specialist/      # Deprecated (use exodia/hades)
│   └── repo-reviewer-agent/     # Repository health reviewer
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PLUGINS.md
│   ├── AGENTS.md
│   ├── WORKFLOWS.md
│   ├── specs/
│   │   ├── spec-template.md
│   │   └── spec-XXXX-*.md
│   ├── decisions/
│   │   ├── adr-template.md
│   │   └── ADR-XXXX-*.md
│   └── examples/
│       └── *.mcp.json           # Example MCP configs (Type T consumption)
│
└── tooling/
    ├── scripts/
    │   ├── weave-validate.sh    # Single validation entrypoint
    │   └── sync-marketplace.sh
    └── templates/
        └── plugin-template/
```

When actual structure differs, move toward this incrementally.

---

## 4. Task Routing (IF/THEN Decision Trees)

**IMPORTANT:** This section implements the Vercel research pattern showing passive context (100% pass rate) outperforms active retrieval (53-79% for skills alone). These decision trees are ALWAYS loaded and guide your task selection.

### Core Routing Logic

Use this decision tree to route tasks to the correct skill or agent:

```text
IF struggling > 2 min
  → read metacognitive-guard skill, escalate to deep-think-partner agent

IF claiming done/complete/fixed/works
  → read verification-before-completion skill (run build+tests, show output)

IF version/date/status question
  → read epistemic-checkpoint skill (check assertions.yaml, then WebSearch)

IF code review needed
  → read competitive-review skill (spawns arch-reviewer + impl-reviewer)

IF building a new feature
  → use feature-dev plugin (code-architect → code-explorer → code-reviewer)

IF writing telemetry/observability code
  → read otel-expert skill, spawn otel-guide agent

IF CI verification before merge
  → read autonomous-ci skill

IF creating hookify rules
  → read writing-rules skill

IF .NET MSBuild/CPM patterns
  → read dotnet-architecture-lint skill

IF about to commit with suppressions/shortcuts
  → completion-integrity blocks it automatically

IF cleanup/elimination/dead code/suppressions/duplication needed
  → exodia/hades skill (Smart cleanup with audit trail, 3 phases x 4 teammates)

IF multi-agent orchestration needed
  → exodia skills (UNRESTRICTED - unlimited parallel agents):
    fix                - P1/P2/P3 bugs (8 std, 16 max agents)
    mega-swarm         - codebase audit (6/8/12 agents by mode)
    deep-think         - multi-perspective analysis (5 agents)
    tournament         - competitive solutions (N+2 agents)
    batch-implement    - parallel similar items (1+N+1 agents)
    red-blue-review    - adversarial security (3+N+1 agents)
    hades              - audited cleanup (3 phases x 4 teammates)

  → workflow-tools commands (4/8 agent limits):
    /fix, /mega-swarm, /red-blue-review, /deep-think, /tournament, /batch-implement

IF zero-tolerance cleanup needed
  → exodia/hades skill (replaces deprecated cleanup-specialist agent)
```

### Exodia Skills Detailed Routing

When multi-agent orchestration is needed, use these IF/THEN patterns:

- **IF fixing P1/P2/P3 bug** THEN use `fix` skill (8 agents standard, 16 maximum)
- **IF need multiple solution perspectives** THEN use `tournament` skill (N competitors)
- **IF complex debugging first** THEN use `deep-think` skill before fix
- **IF implementing multiple similar items** THEN use `batch-implement` skill (diagnostics, tests, endpoints, features, fixes, migrations)
- **IF need adversarial security/quality review** THEN use `red-blue-review` skill (Red attacks, Blue defends)
- **IF comprehensive codebase audit** THEN use `mega-swarm` skill (12 agents full, 6 quick, 8 focused)
- **IF cleanup/elimination/dead code/suppressions** THEN use `hades` skill (Smart IDs, deletion permits, audit ledger)

### Priority and Composition

1. **Check routing tree FIRST** - before searching for skills manually
2. **Skill descriptions are loaded** - they contain additional IF/THEN routing logic
3. **Compose skills** - some workflows chain multiple skills (e.g., mega-swarm → hades)
4. **AGENTS.md is for other AIs** - Codex, Gemini, humans read it, NOT you

---

## 5. Mandatory Workflow (NOT Optional)

**This workflow is ENFORCED, not suggested.** Skipping steps is a failure.

### 5.0 Session Start (EVERY TIME)

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

### 5.1 Skill Check (MANDATORY)

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

### 5.2 Brainstorm FIRST (For New Features)

**DO NOT write code before brainstorming is complete.**

If Superpowers `brainstorming` skill is available:

1. Activate it
2. Refine the idea through questions
3. Explore alternatives
4. Present design in sections for validation
5. Save design document to `docs/designs/`

### 5.3 Plan BEFORE Implementation

If Superpowers `writing-plans` skill is available:

1. Break work into 2-5 minute tasks
2. Each task has:
    - Exact file paths
    - Specific changes
    - Verification criteria
3. Save plan for reference

Use `TodoWrite` for simple tasks.

### 5.4 TDD Implementation (MANDATORY for code)

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

### 5.5 Code Review (BEFORE Claiming Done)

Use the `requesting-code-review` skill if available, OR:

1. Dispatch a review subagent:

   ```text
   "Please dispatch two subagents to review my changes.
   Tell them they're competing with another agent.
   Make sure they look at both architecture and implementation.
   Whomever finds more issues gets promoted."
   ```

2. Fix all Critical issues immediately
3. Fix High issues before proceeding
4. Document Medium/Low issues for future

### 5.5.1 Quad-AI Autonomous Agent System

<EXTREMELY_IMPORTANT>

**This repository uses quad-AI autonomous agents: Claude, Copilot, Gemini, and CodeRabbit.**

### AI Agent Capabilities Matrix

| Agent      | Reviews | Comments | Creates Fix PRs  | Auto-Merge | Bypass Rules |
|------------|---------|----------|------------------|------------|--------------|
| Claude     | ✅       | ✅        | ✅ (via CLI)      | ❌          | ✅            |
| Copilot    | ✅       | ✅        | ✅ (Coding Agent) | ❌          | ✅            |
| Gemini     | ✅       | ✅        | ❌                | ❌          | ❌            |
| CodeRabbit | ✅       | ✅        | ❌                | ❌          | ✅            |

**Autonomous loop enabled:** `detect failure → understand fix → push fix → re-run CI`

### Workflow Triggers

| Workflow                 | Trigger           | Purpose                      |
|--------------------------|-------------------|------------------------------|
| `claude.yml`             | `@claude` mention | Interactive responses        |
| `claude-code-review.yml` | PR opened/sync    | Formal code review + fix PRs |
| Copilot Coding Agent     | Issue assignment  | Autonomous issue resolution  |

### What All AIs Review (Type A Focus)

Each AI performs **comprehensive, independent reviews** - same scope:

1. **Plugin Schema** - Valid structure, required fields, capability declarations
2. **SKILL.md Quality** - Clear workflows, proper format, no phantom tools
3. **Shell Scripts** - shellcheck compliance, quoting, error handling
4. **YAML Workflows** - actionlint compliance, permissions, triggers
5. **Security** - No secrets in files, no absolute paths, input validation
6. **Documentation** - CHANGELOG, README, usage instructions

### Shared Brain Coordination

AIs coordinate through **shared files**, NOT real-time communication:

```text
┌──────────────────────────────────────────────────┐
│                  SHARED FILES                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│  │CLAUDE.md│  │AGENTS.md│  │CHANGELOG│          │
│  └────┬────┘  └────┬────┘  └────┬────┘          │
└───────┼────────────┼────────────┼────────────────┘
        │            │            │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │ Claude  │  │ Gemini  │  │ Copilot │
   └─────────┘  └─────────┘  └─────────┘
```

### Review Checklist (same for all AIs)

| Check              | Pass Criteria                      |
|--------------------|------------------------------------|
| CI passes          | All checks green                   |
| No secrets exposed | No API keys, tokens, credentials   |
| CHANGELOG updated  | Entry under [Unreleased] if needed |
| Type A focus       | No C#/.NET code, no absolute paths |

### Auto-merge Tiers

1. **Tier 1:** Dependabot/Renovate patch/minor → auto-merge when CI passes
2. **Tier 2:** Copilot fix PR + CI passes → auto-merge
3. **Tier 3:** Claude fix PR + CI passes + 1 approval → auto-merge
4. **Tier 4:** Other PRs → human review required

### Agent-Specific Autonomy

**Claude (You):**

- Use `gh pr create` to create fix PRs directly
- Push to branches via bypass rules
- Workflow triggers on `@claude` mention

**Copilot Coding Agent:**

- Assign issues with `@github-copilot`
- Creates PRs from `copilot/` branches
- Uses `.github/copilot-instructions.md`

### FORBIDDEN

- Do NOT speculate about what other AIs "might find"
- Do NOT add "triangulation notes" guessing other perspectives
- Do NOT claim to know what another AI is thinking

</EXTREMELY_IMPORTANT>

### 5.6 Validation (MANDATORY)

```bash
./tooling/scripts/weave-validate.sh
```

- **MUST pass** before claiming done
- Fix failures and re-run until clean
- Show the output in your report

### 5.7 Documentation (MANDATORY)

For EVERY non-trivial change:

1. **CHANGELOG.md** - Add entry under `## [Unreleased]`
2. **Specs** - Create/update `docs/specs/spec-XXXX-*.md` for features
3. **ADRs** - Create/update `docs/decisions/ADR-XXXX-*.md` for architectural decisions
4. **Docs** - Update ARCHITECTURE.md, PLUGINS.md, AGENTS.md as needed

<EXTREMELY_IMPORTANT>

### ⚠️ CHANGELOG REMINDER - DO NOT SKIP

**BEFORE claiming ANY task is complete, you MUST update CHANGELOG.md:**

1. Open `CHANGELOG.md`
2. Add your entry under `## [Unreleased]`
3. Use the correct category: Added, Changed, Fixed, Removed, Security
4. Be specific: what changed and why

**Format:**

```markdown
## [Unreleased]

### Added

- New feature X for doing Y

### Changed

- Updated Z to improve performance

### Fixed

- Resolved bug in W that caused Q
```

**NO EXCEPTIONS.** Forgetting to update CHANGELOG = incomplete task.

</EXTREMELY_IMPORTANT>

### 5.8 Final Report (MANDATORY)

Your completion message MUST include:

| Item                  | Required                    |
|-----------------------|-----------------------------|
| Files modified        | List with summary           |
| Validation output     | `weave-validate.sh` results |
| Specs created/updated | IDs and filenames           |
| ADRs created/updated  | IDs and filenames           |
| CHANGELOG entry       | Exact text added            |
| Remaining issues      | Any unresolved items        |

---

## 6. Plugins & Marketplace

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

Each plugin in `plugins/<name>/` (per [official docs](https://code.claude.com/docs/en/plugins)):

```text
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json      # REQUIRED: name, version, description, author
├── README.md            # REQUIRED: User-facing docs
├── skills/
│   └── <skill>/
│       └── SKILL.md     # YAML frontmatter required
├── commands/            # Slash commands (.md)
├── agents/              # Custom agents
├── hooks/               # Event hooks (hooks.json)
└── scripts/             # Shell helpers (.sh)
```

### SKILL.md Format

All SKILL.md files MUST have YAML frontmatter (per [official docs](https://code.claude.com/docs/en/skills)):

```yaml
---
name: skill-name          # Required: kebab-case, max 64 chars
description: What this skill does and when to use it  # Required: max 1024 chars
---

# Skill: skill-name

[Your skill content here - markdown format]
```

**Optional frontmatter:** `allowed-tools` to restrict which tools Claude can use.

**Note:** Our internal skills may include additional sections (MANDATORY ACTIVATION, WORKFLOW, FAILURE CONDITIONS) as team standards, but only `name` and `description` are required by Claude Code.

---

## 7. Superpowers Integration

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

## 8. CI & Validation

### CI Jobs (`.github/workflows/ci.yml`)

- `plugin-validation`: `claude plugin validate .` + per-plugin
- `shell-scripts`: `shellcheck` on `*.sh` files
- `markdown`: `markdownlint` on `**/*.md`
- `workflow-syntax`: `actionlint` on workflows

### Local Validation

Single entrypoint:

```bash
./tooling/scripts/weave-validate.sh
```

**MUST pass before claiming any task complete.**

---

## 9. Specs & ADRs

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

## 10. MCP Integration (Type T Consumption)

This repo creates **Type A** artifacts (Skills/Plugins) that consume **Type T** tools (from `ancplua-mcp`).

**Do NOT implement MCP Servers in this repo.**

Instead:

1. Define the MCP usage in `docs/examples/*.mcp.json` (Type T consumption config).
2. Create a Skill in `plugins/<name>/skills/` that **calls** the MCP tools.
3. Document the dependency in the plugin's `README.md`.

### 10.1 Dual-Repo Workflow

Both repos often need synchronized changes (e.g., CI workflows, shared configs).

**Repository Locations:**
```bash
# Type A (Application) - Claude plugins/skills
~/WebstormProjects/ancplua-claude-plugins

# Type T (Infrastructure) - .NET MCP servers
~/ancplua-mcp
```

**Sync Both Repos:**
```bash
# After merging PRs in both repos
cd ~/WebstormProjects/ancplua-claude-plugins && git fetch origin && git reset --hard origin/main
cd ~/ancplua-mcp && git fetch origin && git reset --hard origin/main
```

**Validate Both Repos:**
```bash
# Run validation on both
~/WebstormProjects/ancplua-claude-plugins/tooling/scripts/weave-validate.sh
~/ancplua-mcp/tooling/scripts/weave-validate.sh

# Or use the --dual flag (validates sibling repo too)
./tooling/scripts/weave-validate.sh --dual
```

**Create Matching PRs:**
When changes affect both repos (e.g., workflow updates):
1. Create branch with same name in both repos
2. Make changes in both
3. Create PRs in both
4. Merge both (or enable auto-merge)
5. Sync both repos to main

---

## 11. Interaction Principles

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

## 12. Quick Reference

### Session Start

```bash
pwd                              # Confirm location
git status --short               # Check state
cat CLAUDE.md                    # Load context
./tooling/scripts/weave-validate.sh  # Baseline
```

### Skill Search

```bash
find . -name "SKILL.md"                    # Local
find ~/.claude -name "SKILL.md" 2>/dev/null # Superpowers
```

### Validation

```bash
./tooling/scripts/weave-validate.sh
claude plugin validate .
```

### Documentation Paths

- CHANGELOG: `CHANGELOG.md`
- Specs: `docs/specs/spec-XXXX-*.md`
- ADRs: `docs/decisions/ADR-XXXX-*.md`
- Architecture: `docs/ARCHITECTURE.md`

---

## 13. Failure Conditions

You have FAILED your task if:

1. ❌ You skip a skill that applies to your task
2. ❌ You write code before tests (when TDD applies)
3. ❌ You claim done without validation passing
4. ❌ You leave changes undocumented
5. ❌ You rationalize why rules don't apply to you
6. ❌ You hide errors or failures
7. ❌ You commit without explicit human permission

---

## 14. Success Conditions

You have SUCCEEDED when:

1. ✅ All applicable skills were used
2. ✅ Workflow was followed completely
3. ✅ Validation passes
4. ✅ Documentation is updated
5. ✅ Final report includes all required items
6. ✅ Evidence supports your claims

---

## 15. SOLID Principles for Plugins

Apply these principles when designing or modifying plugins:

### Single Responsibility

Each plugin should do ONE thing well:

- `autonomous-ci` → CI verification only
- `code-review` → Code analysis only
- `metacognitive-guard` → Cognitive amplification (agents + hooks)
- `otelwiki` → OpenTelemetry documentation only
- `dotnet-architecture-lint` → .NET build patterns only
- `completion-integrity` → Task completion quality only
- `workflow-tools` → Multi-agent orchestration workflows
- `hookify` → User-configurable hooks
- `feature-dev` → Guided feature development

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
- MCP servers provide the implementation
- Plugins orchestrate, never implement low-level operations

---

## 16. Thought Transparency (Agent Behavior)

### Observable Decision Making

When executing complex tasks, maintain visibility:

```markdown
## Processing Log

**Task:** [Description]
**Status:** In Progress

### Steps

- [x] Step 1: Gathered context
- [x] Step 2: Identified files
- [ ] Step 3: Implementing changes
- [ ] Step 4: Validation
```

### Granular Task Decomposition

Break work into atomic units:

- Each step should be independently verifiable
- Steps execute sequentially, not in parallel batches
- Complete one phase before starting the next

### Mental State Bookkeeping

Track internal state explicitly:

- Use `TodoWrite` for task tracking
- Mark completed items immediately
- Never claim completion without evidence

### Silent Processing with Tracked Updates

- Work silently on implementation
- Update progress via `TodoWrite`
- Report results only when complete or blocked

---

## 17. DevOps Excellence (CALMS Framework)

### Culture

- **Blameless post-mortems:** When things fail, focus on systemic improvements
- **Shared ownership:** All agents (Claude, Copilot, Gemini, CodeRabbit) share responsibility
- **Fast feedback:** Validate early and often

### Automation

- **CI/CD:** All changes go through `.github/workflows/ci.yml`
- **Validation:** `weave-validate.sh` is the single source of truth
- **No manual steps:** If it can be automated, it must be

### Lean

- **Small batches:** Prefer multiple small PRs over one large PR
- **Minimize waste:** Don't over-document, don't over-engineer
- **Build quality in:** Validate during development, not after

### Measurement

Track these DORA-inspired metrics:

| Metric               | Target  | How to Measure           |
|----------------------|---------|--------------------------|
| Validation Pass Rate | >95%    | CI green on first push   |
| Lead Time            | <1 hour | Commit to merge time     |
| Change Failure Rate  | <15%    | PRs requiring fixes      |
| Recovery Time        | <30 min | Time to fix broken build |

### Sharing

- **Document decisions:** ADRs for architecture, specs for features
- **Cross-agent communication:** AGENTS.md, CLAUDE.md, GEMINI.md
- **Knowledge transfer:** Skills encode reusable workflows

---

## 18. Error Handling Conventions

### Standardized Error Responses

When reporting errors, use this format:

```markdown
## Error Report

**Type:** [Validation|Runtime|Configuration]
**Severity:** [Critical|High|Medium|Low]
**Location:** [File:Line or Command]

### Description

[What went wrong]

### Evidence

[Error output, logs, or screenshots]

### Attempted Fixes

1. [What you tried]
2. [What you tried]

### Recommendation

[Next steps or escalation path]
```

### Validation Failures

1. Parse error output completely
2. Identify root cause (not just symptoms)
3. Attempt automatic fix if deterministic
4. Retry with backoff if transient
5. Escalate with full context if persistent

### Never Hide Failures

- Show error output in reports
- Explain why something failed
- Propose solutions, don't just report problems

---

**This file is your operational spec. Follow it.**
