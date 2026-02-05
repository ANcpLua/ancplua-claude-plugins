# Changelog

All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Review findings sweep (2026-02-05):**
  - Propagated `weave-validate.sh` rename across 9 files (CLAUDE.md, GEMINI.md, copilot-instructions, docs/*, templates)
  - Removed all Jules references — user no longer uses Jules AI agent
    - Deleted `.github/workflows/jules-auto-review.yml`
    - Updated Penta-AI → Quad-AI (Claude, Copilot, Gemini, CodeRabbit)
    - Removed from: CLAUDE.md, GEMINI.md, copilot-instructions.md, auto-merge.yml, claude-code-review.yml, .gemini/
  - Fixed 4 marketplace.json version mismatches: metacognitive-guard 0.2.4→0.2.6, otelwiki 1.0.5→1.0.6, dotnet-architecture-lint 1.0.0→1.0.1, feature-dev 0.1.0→1.0.0
  - Fixed cleanup-specialist dangling `AGENTS_BASE.md` reference (file was deleted)
  - Fixed copilot-instructions.md stale target architecture (smart-commit, jules-integration → current 11 plugins)
  - Fixed AGENTS.md counts: 10→11 plugins, 9→11 agents (including standalone)
  - Fixed ADR-0002 dangling `skills/working-on-ancplua-plugins/` reference
  - Rewrote docs/AGENTS.md: stale planned agents → current agent inventory (11 agents, 2 standalone + 9 plugin-hosted)
  - Fixed CLAUDE.md target architecture: removed deleted dirs, added current plugins

### Added

- **exodia v1.0.0 plugin (2026-02-05):**
  - Skills-standard counterpart to workflow-tools (same 8 workflows as skills instead of commands)
  - Skills: turbo-fix, fix, fix-pipeline, tournament, mega-swarm, deep-think, batch-implement, red-blue-review
  - AGENTS.md passive context with decision tree and compressed docs index
  - Follows skills.sh open standard: `skills/{name}/SKILL.md` with YAML frontmatter
- **AGENTS.md for ANcpLua.Roslyn.Utilities (2026-02-05):**
  - Compressed decision tree routing agents to use utilities instead of raw Roslyn APIs
  - Pipe-delimited docs index pointing to 3 CLAUDE.md files (1,867 lines total)
  - Key instruction: "NEVER write raw Roslyn API code. Always use utilities first."
  - Covers: Guard, Match DSL, DiagnosticFlow, EquatableArray, Contexts, Extensions
- **AGENTS.md for ANcpLua.Analyzers (2026-02-05):**
  - Compressed decision tree for analyzer/code fix/test development patterns
  - Updated diagnostic categories: AL0001-AL0093 (93 diagnostics, not 44)
  - Maps all source of truth files, banned patterns, and testing conventions

### Changed

- **AGENTS.md rewritten as compressed passive-context index (2026-02-05):**
  - Applied Vercel AGENTS.md research: passive context outperforms skills (100% vs 53%)
  - Replaced 307-line bloated AGENTS.md with 115-line compressed routing index
  - Added decision tree: tells agents WHEN to use WHICH skill/agent/command
  - Added pipe-delimited docs index mapping all 10 skills, 9 agents, 8 commands
  - Key instruction: "Prefer retrieval-led reasoning over pre-training-led reasoning"
  - Removed stale content: smart-commit refs, planned agents, Jules API examples
- **Skills refactor — compress for agent efficiency (2026-02-05):**
  - Applied learnings from Vercel AGENTS.md research and skills.sh FAQ best practices
  - Compressed all 7 bloated skills (total reduction: 65% fewer lines)
  - Moved verbose reference material to `references/` directories (progressive disclosure)
  - autonomous-ci: 272→67 lines, added `references/project-examples.md`
  - code-review: 214→74 lines, added `references/common-patterns.md`
  - hookify/writing-rules: 393→75 lines, added `references/patterns-and-examples.md`
  - metacognitive-guard: 119→63 lines
  - competitive-review: 131→55 lines
  - epistemic-checkpoint: 127→46 lines
  - verification-before-completion: 164→62 lines
  - Concise skills left unchanged: completion-integrity (49), dotnet-architecture-lint (55), otel-expert (53)

### Removed

- **Dead directories and orphaned artifacts (2026-02-05):**
  - Deleted `agents/workflow-orchestrator/` — referenced deleted plugins (smart-commit, jules-integration)
  - Deleted `agents/AGENTS_BASE.md` — stale shared prompt referencing deleted plugins
  - Deleted `skills/working-on-ancplua-plugins/` — redundant with CLAUDE.md (passive context beats skills)
  - Deleted `docs/specs/spec-0004-jules-integration.md` — spec for deleted plugin
  - Deleted `docs/specs/spec-0005-workflow-orchestrator.md` — spec referencing deleted plugins
  - Deleted `docs/decisions/ADR-0003-jules-agent-delegation.md` — ADR for deleted plugin

### Fixed

- **Stale references cleanup (2026-02-05):**
  - Removed smart-commit and jules-integration references from `docs/ARCHITECTURE.md`
  - Removed smart-commit integration section from `plugins/code-review/README.md` and SKILL.md
  - Fixed README.md: plugin count 9→10, added ancplua-project-routing, version updates

### Added

- **workflow-tools v2.0.0 - Major refactor with patterns from ErrorOrX (2026-02-04):**
  - **New `/fix` command** - Unified fix pipeline merging turbo-fix + fix-pipeline
    - Configurable parallelism: `maximum` (16 agents) or `standard` (8 agents)
    - Mode variants: `aggressive`, `balanced`, `conservative`
    - Quick mode: `quick=true` skips devil's advocate phases
    - Gate checkpoints between each phase with pass/fail validation
  - **New `/red-blue-review` command** - Adversarial security review pattern
    - Phase 1: Red Team Attack (3 agents: Crash Hunter, Security Attacker, API Breaker)
    - Phase 2: Blue Team Defense (1 agent per valid finding)
    - Phase 3: Verification (Red re-attacks each fix)
    - Scoring system with points for valid findings, penalties for false alarms
    - Release recommendation output: SAFE TO RELEASE or BLOCK RELEASE
  - **Updated `/tournament`** - Penalty-based scoring with transparency
    - Scoring rubric now shown in competitor prompts (not just judge phase)
    - Penalties: style nitpicks (-2), over-engineering (-3), doesn't compile (-10)
    - Explicit tiebreaker rules: Correctness → Performance → First submitted
  - **Updated `/mega-swarm`** - Configurable agent count
    - Mode parameter: `full` (12 agents), `quick` (6 agents), `focused` (8 agents)
    - Gate checkpoint after agent completion with ≥80% success threshold
  - **Deprecated commands:**
    - `/turbo-fix` → Use `/fix parallelism=maximum` instead
    - `/fix-pipeline` → Use `/fix` instead (standard parallelism is default)
  - **Inspired by ErrorOrX patterns:** stage-gated pipelines, adversarial review, penalty scoring

- **cleanup-specialist agent v1.0.0 (2026-02-04):**
  - Zero-tolerance cleanup agent - no suppressions, no shortcuts, no technical debt
  - **Phase 0**: Suppression audit FIRST - finds all #pragma, NoWarn, SuppressMessage
  - **Phase 1**: Dead code elimination - unused imports, methods, orphan files
  - **Phase 2**: Duplication elimination - extract to shared utilities
  - **Phase 3**: Cross-repo cascade - upstream fixes, publish, update downstream
  - **Phase 4**: Iterate until clean - count > 0 means GO AGAIN
  - Auto-detects scope: single-file, multi-file, repo, or cross-repo
  - Dispatches to domain specialists when needed
  - Mantra: "Clean code. No exceptions. No excuses. Iterate until done."

- **ancplua-project-routing plugin v1.0.0 (2026-01-30):**
  - Auto-routes Claude to specialist agents based on current project directory
  - SessionStart hook injects project-specific context
  - **Supported projects:**
    - ErrorOrX → erroror-generator-specialist
    - ANcpLua.Analyzers → ancplua-analyzers-specialist
    - ANcpLua.NET.Sdk → ancplua-sdk-specialist, msbuild-expert
    - ANcpLua.Roslyn.Utilities → (with caution - consumers depend on it)
    - qyl → qyl-observability-specialist, otel-genai-architect
    - ServiceDefaults → servicedefaults-specialist, otel-genai-architect
    - Template → template-clean-arch-specialist
    - ancplua-claude-plugins → Type A rules
    - ancplua-mcp → Type T rules
  - Each routing context includes key patterns, available skills, and verification commands

### Changed

- **ancplua-project-routing - ServiceDefaults merged into qyl (2026-02-04):**
  - Removed separate ServiceDefaults routing (now part of qyl)
  - Updated qyl routing to include servicedefaults-specialist
  - qyl routing now mentions OTel SemConv v1.39 and source generator instrumentation

### Removed

- **ancplua-docs-librarian plugin (2026-01-30):**
  - Removed documentation librarian plugin (ANcpLua ecosystem moved to separate site)
  - Deleted `plugins/ancplua-docs-librarian/` directory
  - Removed from marketplace.json

- **docfx-principal plugin (2026-01-30):**
  - Removed DocFX documentation agent plugin (no longer needed)
  - Deleted `plugins/docfx-principal/` directory
  - Deleted `docs/specs/spec-0006-docfx-principal.md`
  - Removed from marketplace.json

### Added

- **docfx-principal plugin v1.0.0 (2026-01-14):**
  - DocFX documentation pipeline expert agent using Opus model
  - **Capabilities:**
    - Audits existing DocFX configurations and produces `DOCFX_AUDIT.md`
    - Fixes metadata extraction from .NET assemblies (XML docs → API YAML)
    - Configures navigation architecture (toc.yml hierarchies)
    - Resolves cross-reference issues (xref, UID resolution)
    - Implements multi-repo documentation aggregation
    - Validates GitHub Pages deployment requirements (`.nojekyll`, assets)
  - **Use Cases:**
    - DocFX build failures or warnings
    - Empty API documentation despite XML comments
    - Broken navigation or missing pages
    - Unresolved cross-references (xref warnings)
    - Multi-repository documentation sites
    - GitHub Pages 404 errors
  - **Tools:** Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch

- **trigger-docs.yml workflow (2026-01-14):**
  - Triggers documentation rebuild on ANcpLua.io when this repo changes
  - Triggers on: push to main, release published
  - Sends repository_dispatch event to ANcpLua/ANcpLua.io with event type `docs-update`
  - Client payload includes source repo name and git ref
  - Uses DOCS_TRIGGER_PAT secret for authentication
  - Enables automatic documentation updates at https://ancplua.github.io/ANcpLua.io/

### Fixed

- **metacognitive-guard v0.2.6, otelwiki v1.0.6: Remove duplicate hooks declaration:**
  - Claude Code auto-loads `hooks/hooks.json` from standard location
  - Explicit `"hooks": "./hooks/hooks.json"` in plugin.json caused duplicate load error
  - Removed redundant hooks field from both plugin manifests

- **otelwiki v1.0.5, ancplua-docs-librarian v1.0.1: Convert inline prompt hooks to script-based:**
  - Claude Code v2.1.2 bug: prompt hooks in SessionStart require ToolUseContext
  - Workaround: replaced `type: prompt` with `type: command` running `session-prompt.sh`
  - Both plugins now use shell scripts to output their freshness prompts

- **otelwiki v1.0.4: Remove PostToolUse hooks causing "stopped continuation" bug:**
  - PostToolUse prompt hooks fired on EVERY Edit/Write, regardless of file type
  - Claude interpreted these prompts as instructions to stop and explain why they don't apply
  - This caused Claude to stop after every edit with messages like "The edited file is a Swift source file, not a .props file..."
  - **Solution:** Removed PostToolUse hooks entirely - OTel validation available via otel-guide agent on demand
  - SessionStart hooks preserved for freshness check

- **dotnet-architecture-lint v1.0.1: Remove stale cached hooks causing same bug:**
  - hooks.json was deleted from source in commit 1e2893e but plugin cache retained old version
  - Cache cleared to apply fix

- **metacognitive-guard v0.2.5 robustness improvements:**
  - `epistemic-guard.sh`: Added jq availability check with grep/sed fallback for systems without jq
  - `struggle-detector.sh`: Added safety checks for empty arrays to prevent errors with `set -u`

- **otelwiki v1.0.4 robustness improvements:**
  - `check-freshness.sh`: Added `set -euo pipefail`, switched to `#!/usr/bin/env bash` for portability
  - Added proper PLUGIN_ROOT validation and error handling

- **dotnet-architecture-lint: Convert useless PostToolUse to blocking PreToolUse hook:**
  - Previous hook fired on ALL Edit/Write operations, then asked Claude to self-filter
  - This produced noise like "Edit to .cs file detected, but this is not a config file..."
  - New PreToolUse hook uses Python script to:
    - Only process .props, .targets, .csproj, global.json, nuget.config files
    - Validate proposed content BEFORE write (not after)
    - Exit 2 to BLOCK edits that violate MSBuild architecture rules
  - Rules enforced: RULE_A (no hardcoded versions in Directory.Packages.props), RULE_B (Version.props import restrictions), RULE_G (no inline PackageReference versions)

### Changed

- **Plugin ecosystem cleanup (2026-01-08):**
  - Rationalized plugin set from 18+ to 12 core plugins
  - Removed duplicates and unused plugins:
    - `ralph-wiggum` - Experimental, unused
    - `accessibility-compliance@claude-code-workflows` - Unused
    - `code-review@claude-code-plugins` - Duplicate of `code-review@ancplua-claude-plugins`
    - `plugin-dev@claude-code-plugins` - Duplicate with issues
    - `plugin-dev@claude-plugins-official` - Had 7x duplicate agents
    - `superpowers-developing-for-claude-code` - Plugin dev helper, niche use
    - `framework-migration@claude-code-workflows` - Caused issues, not installed
  - Verified `workflow-tools` commands use `metacognitive-guard:arch-reviewer` (no dependency on removed plugins)
  - Kept `feature-dev@claude-code-plugins` (workflow-tools depends on code-architect, code-explorer, code-reviewer agents)
  - **Final plugin set (12 core):**
    - Tier 1: superpowers, episodic-memory, elements-of-style, commit-commands, hookify
    - Tier 2: metacognitive-guard, otelwiki, ancplua-docs-librarian, workflow-tools
    - Tier 3: double-shot-latte, superpowers-chrome, feature-dev

### Added

- **workflow-tools plugin (2026-01-08):**
  - Post-audit workflow commands for systematic fixing and parallel implementation
  - **Commands:**
    - `tournament` - **Competitive coding tournament** - N agents compete on same task, judge picks winner
    - `turbo-fix` - **16 agents across 4 phases** - Maximum parallelism fix pipeline (6→4→3→3)
    - `mega-swarm` - **12 specialized auditors simultaneously** - Comprehensive codebase analysis
    - `fix-pipeline` - Takes audit findings through: Deep Analysis → Plan → Implement → Verify
    - `deep-think` - Extended multi-perspective reasoning before action (debugger, architect, explorer, devil's advocate)
    - `batch-implement` - Parallel implementation of similar items (diagnostics, tests, endpoints, fixes)
  - **Features:**
    - **Fully autonomous by default** - runs all phases without stopping for user input
    - **Maximum parallelism** - launch ALL agents within each phase simultaneously
    - Uses Opus model for deep reasoning phases
    - TDD enforcement in implementation phase
    - Type-specific guidance (diagnostics, tests, endpoints, migrations)
    - Interactive mode available with `auto=false`
  - **Agent Counts:**
    - `/tournament` - N+2 (N competitors + judge + implementer)
    - `/mega-swarm` - 12 parallel (all simultaneous)
    - `/turbo-fix` - 16 total (6→4→3→3 phased)
    - `/fix-pipeline` - 8 total (3→2→1→1 phased)
    - `/deep-think` - 5 total (3→2 phased)
    - `/batch-implement` - N+2 (scales with items)
  - **Use Cases:**
    - Post-swarm-audit systematic fixing
    - Complex debugging requiring multiple perspectives
    - Mass implementation of similar features

### Fixed

- **workflow-tools commands (2026-01-08):**
  - Removed unsupported Handlebars template syntax (`{{ }}`, `{{#each}}`, `{{#if}}`)
  - Fixed frontmatter to use only supported fields (`description`, `allowed-tools`)
  - Changed variable references from `{{ var }}` to `$1`, `$2`, `$3` positional args
  - Added `allowed-tools: Task, Bash, TodoWrite` for proper tool access
  - All 6 commands now work correctly with Claude Code slash command system

- **completion-integrity plugin (2026-01-08):**
  - Prevents Claude from taking shortcuts to finish tasks
  - **Git Pre-Commit Hook:**
    - `scripts/install-git-hook.sh` - installs native git hook
    - Works in ALL modes including `--dangerously-skip-permissions`
    - Blocks commits with: warning suppressions, commented tests, deleted assertions, deleted test files
  - **Manual Script:**
    - `scripts/integrity-check.sh` for on-demand scanning of staged changes
  - Note: Claude plugin hooks removed (don't work with bypass mode)

- **ancplua-docs-librarian plugin (2026-01-02):**
  - Documentation librarian for the ANcpLua ecosystem (SDK, Analyzers, Roslyn Utilities)
  - **Components:**
    - `ancplua-docs` skill - Search strategy and 75+ documentation file map
    - `ancplua-librarian` agent - Answers questions with file citations using haiku model
  - **Features:**
    - Auto-triggers on questions about SDK features, analyzer rules, or utility APIs
    - Cross-repository search across all three documentation sources
    - Citation-based answers with exact file paths
    - Topic classification (SDK/Analyzers/Utilities) for targeted searches
  - **Documentation Coverage:**
    - ANcpLua.NET.Sdk: SDK variants, banned APIs, polyfills, test fixtures, MSBuild properties
    - ANcpLua.Analyzers: 17 rules (AL0001-AL0017) with per-rule documentation
    - ANcpLua.Roslyn.Utilities: DiagnosticFlow, SemanticGuard, SymbolPattern, domain contexts

### Fixed

- **workflow-tools slash command syntax compliance (2026-01-08):**
  - Fixed 5 commands using unsupported Handlebars template syntax (`{{ }}`, `{{#if}}`, `{{#each}}`)
  - Replaced with official Claude Code `$1`, `$2`, `$3` positional argument syntax
  - Removed unsupported `name` field from all command frontmatter
  - Removed unsupported `arguments` array from all command frontmatter
  - Added `allowed-tools` field to all commands (Task, Bash, TodoWrite as needed)
  - Affected commands: `fix-pipeline`, `mega-swarm`, `turbo-fix`, `deep-think`, `batch-implement`
  - Reference: https://code.claude.com/docs/en/slash-commands

- **Agent tools YAML format + model upgrades (2026-01-06):**
  - Fixed `tools` field in 3 agents using string format instead of YAML array
  - Affected: `otelwiki/otel-guide`, `otelwiki/otel-librarian`, `ancplua-docs-librarian/ancplua-librarian`
  - Changed `tools: Read, Grep, Glob` to proper YAML list format
  - Added WebSearch/WebFetch to all agents for version freshness checks
  - Upgraded agent models: opus for reasoning agents, sonnet for doc lookup

- **Missing hooks declarations in plugin.json (2026-01-06):**
  - Added `"hooks": "./hooks/hooks.json"` to `metacognitive-guard` plugin.json
  - Added `"hooks": "./hooks/hooks.json"` to `otelwiki` plugin.json
  - Added `"hooks": "./hooks/hooks.json"` to `ancplua-docs-librarian` plugin.json

- **Unified freshness hooks (2026-01-06):**
  - Added SessionStart hooks with freshness prompts to all doc-related plugins
  - Auto-triggers version check if user mentions search/latest/update/versions
  - Otherwise prompts: "Quick version check?" before proceeding
  - otelwiki: checks OTel semconv releases, offers sync + delta
  - ancplua-docs-librarian: checks ANcpLua.NET.Sdk, Roslyn, xUnit versions
  - Prevents suggesting outdated APIs, deprecated patterns, or old package versions

- **metacognitive-guard plugin not loading (2025-12-23):**
  - Added missing component paths to plugin.json (`skills`, `agents`, `hooks`)
  - Fixed PreToolUse matcher format from string `"Write|Edit"` to proper object `{"tool": "Write"}`
  - Removed invalid `"matcher": ".*"` from Stop hook (Stop doesn't use matchers)
  - Version bump to 0.2.1

- **metacognitive-guard hooks.json structure (2025-12-19):**
  - Fixed missing top-level `hooks` object wrapper causing plugin load failure
  - Event types (SessionStart, PreToolUse, Stop) must be nested under `hooks` key per Claude Code schema

### Changed

- **README.md overhaul (2025-12-23):**
  - Updated plugin table with all 7 plugins including metacognitive-guard and otelwiki
  - Simplified install instructions and plugin details
  - Removed outdated directory structure references

### Added

- **dotnet-architecture-lint plugin (2026-01-02):**
  - Deterministic bash linter for .NET build patterns with dotnet tool fallback
  - **Rules enforced:**
    - Rule A: No hardcoded versions in Directory.Packages.props
    - Rule B: Version.props import owners (Directory.Packages.props, eng/Directory.Build.props, src/Sdk/*/Sdk.props)
    - Rule C: Version.props symlink integrity in consumer repos
    - Rule G: CPM enforcement (no inline PackageReference versions)
  - PostToolUse hook triggers automatically on .props/.targets/.csproj edits
  - `/lint-dotnet` skill for on-demand architecture validation
  - Hybrid approach: bash script with optional `ancplua-lint` dotnet tool integration
  - Multi-repo symlink pattern support (SDK → consumer repos via symlinks)

- **metacognitive-guard cognitive amplification stack (2025-12-19):**
    - **New Skills (3):**
        - `epistemic-checkpoint` - Forces verification of versions/dates/status via WebSearch before forming beliefs
        - `competitive-review` - Dispatches competing arch-reviewer and impl-reviewer for thorough analysis
        - `verification-before-completion` - Prevents false "it works" claims by requiring actual test execution
    - **New Agents (2):**
        - `arch-reviewer` - Architecture-focused reviewer (SOLID, dependencies, SSOT, layer boundaries)
        - `impl-reviewer` - Implementation-focused reviewer with WebSearch for fact-checking version claims
    - **Architecture:** Layered cognitive amplification (Layer 0: hooks block wrong output, Layers 1-5: skills prevent wrong reasoning)
    - Version bump to 0.2.0

- **metacognitive-guard plugin (2025-12-19):**
    - New plugin for detecting when Claude is struggling and escalating to deep-thinking agents
    - `struggle-detector.sh` Stop hook analyzing responses for 8 signal types:
      hedging, deflecting, verbose, contradiction, apologetic, weaseling, restarting, no-recommendation
    - `deep-think-partner.md` Opus-powered agent with structured reasoning protocol
    - `SKILL.md` with self-assessment guidance for proactive escalation
    - Negative scoring for active tool use (reduces false positives)
    - Achieves 3-4x token efficiency on complex architectural questions

- **testcontainers-dotnet plugin (2025-11-29):**
    - New plugin for .NET integration testing with Testcontainers
    - SKILL.md with patterns for xUnit v3, Moq, PostgreSQL, RabbitMQ, Elasticsearch, MinIO
    - `/testcontainers-dotnet:docker-tests` slash command for generating container-based tests
    - Example test files demonstrating MockRepository, FakeLogger, handler extraction patterns
    - Package compatibility matrix for .NET 8/9/10

### Removed

- **metacognitive-guard `using-superpowers` skill (2025-12-19):**
    - Removed due to naming collision with official Superpowers plugin's `using-superpowers` skill
    - Collision caused Claude to invoke duplicate/wrong skills (e.g., brainstorm vs brainstorming)
    - Users should rely on official Superpowers orchestration + metacognitive-guard's unique skills

### Security

- **Claude detection anti-spoofing fix (2025-11-28):**
    - `auto-merge.yml`: Claude approval now requires `github-actions[bot]` + `## Claude Code Review` header
    - `jules-auto-review.yml`: Same fix applied to jules-implement-suggestions job
    - Prevents humans from spoofing Claude reviews by adding text to review body
    - Added SC2086 fixes: quoted all `$GITHUB_OUTPUT` references

- **Bot comment cascade prevention (2025-11-28):**
    - `claude.yml`: Added bot comment filtering to prevent workflow cascade from AI reviewer comments
    - Filters: `sender.type != 'Bot'`, copilot[bot], coderabbitai[bot], gemini-code-assist[bot], github-actions[bot]
    - Prevents 30-45 pending workflow runs when Copilot/CodeRabbit/Gemini leave multiple review comments

### Fixed

- **Workflow alignment for full autonomy (2025-11-28):**
    - `ci.yml`: Node 25 → 22 LTS, fixed SC2156 filename injection vulnerability
    - `jules-auto-review.yml`: Added `jules/`, `copilot/`, `claude/` branch exclusions to prevent infinite loops,
      set `requirePlanApproval: false` for fully autonomous operation, fixed SC2086 quoting issues,
      moved PR title/number to env vars to prevent script injection
    - `auto-merge.yml`: Added Renovate tier, AI Agent tier (copilot/jules/claude branches), Claude-approved tier,
      fixed SC2086 and script injection vulnerabilities
    - `claude-code-review.yml`: Added `workflow_dispatch`, `ready_for_review` trigger, draft PR skip,
      Type A repository review checklist
    - `claude.yml`: Added `jq`, `yq` tools for JSON/YAML work in Type A repo context

### Changed

- **Skills reference docs improved (2025-11-28):**
    - Updated `skills/working-on-ancplua-plugins/` to align with official Claude Code docs
    - `conventions.md`: Fixed directory structure (`lib/` → `agents/`), added plugin.json fields table
    - `publishing.md`: Fixed JSON example, marked optional fields, added template usage
    - `testing.md`: Added sync-marketplace.sh, Claude Code log locations, debugging checklist
    - `SKILL.md`: Added official documentation links, marketplace sync command

- **Documentation aligned with official Claude Code docs (2025-11-28):**
    - Rewrote `README.md` with official `/plugin` install commands
    - Fixed `CLAUDE.md` plugin structure (added `agents/`, removed `lib/`)
    - Fixed `CLAUDE.md` step numbering (1,2,4,5 → 1,2,3,4)
    - Clarified SKILL.md format: only `name` and `description` required per official docs
    - Added links to official documentation throughout
    - Updated `plugin-template` to match official structure
    - Added `agents/` directory to plugin template

- **Copilot instructions location fix (2025-11-28):**
    - Moved `.github/instructions/copilot.instructions.md` → `.github/copilot-instructions.md`
    - Repository-wide instructions location per GitHub best practices
    - Updated all references in CLAUDE.md, GEMINI.md, CHANGELOG.md
    - Closes #11

- **Penta-AI Autonomous Agent System (2025-11-28):**
    - Upgraded from Quad-AI to Penta-AI (Claude, Jules, Copilot, Gemini, CodeRabbit)
    - All five agents can now create fix PRs autonomously (except Gemini)
    - Updated AI capability matrix with new columns: Creates Fix PRs, Auto-Merge, Bypass Rules
    - Added comprehensive GitHub settings guide for maximum autonomy in `AGENTS.md`
    - Updated workflow permissions in `claude.yml` and `claude-code-review.yml`:
        - Changed `contents: read` → `contents: write` for merge operations
        - Added `--allowed-tools` for `gh pr merge`, `gh pr view`, `gh pr diff`, `gh pr comment`
    - Documented autonomous loop: `detect failure → understand fix → push fix → re-run CI`
    - Auto-merge tiers updated:
        - Tier 1: Dependabot/Renovate → auto-merge
        - Tier 2: Copilot/Jules fix PRs → auto-merge
        - Tier 3: Claude fix PRs + 1 approval → auto-merge
        - Tier 4: Other PRs → human review
    - Branch protection bypass rules documented for: Copilot, Claude, Jules, Dependabot, Renovate, Mergify, CodeRabbit

### Added

- **Copilot Coding Agent Instructions (2025-11-28):**
    - Created `.github/copilot-instructions.md` (506 lines)
    - Comprehensive guide for GitHub Copilot coding agent
    - Includes: autonomous agent mode, target architecture, Type A/T separation
    - Documents plugin structure, validation, code style, SOLID principles
    - Full penta-AI system documentation with capability matrix
    - GitHub settings guide for maximum agent autonomy

- **GitHub Actions Workflows (2025-11-25):**
    - `.github/workflows/claude.yml` - Main Claude Code interaction workflow
        - Configured for `claude-opus-4-5-20251101` model
        - Triggers on issue/PR comments mentioning `@claude`
    - `.github/workflows/claude-code-review.yml` - Automated PR review workflow
        - Customized prompt for Plugin Marketplace context
        - Grants read permissions for PRs and Checks
        - Uses `fetch-depth: 0` for full diff context

- **Architecture & Compliance Overhaul (2025-11-25):**
    - **Defined Type A vs Type T Architecture:**
        - `ancplua-claude-plugins` (Type A): "The Brain" (Skills, Plugins, Orchestration)
        - `ancplua-mcp` (Type T): "The Hands" (MCP Servers, Tools)
        - Explicitly documented separation in `CLAUDE.md`, `GEMINI.md`, and `docs/ARCHITECTURE.md`
    - **Tooling & Templates:**
        - Updated `tooling/scripts/local-validate.sh` with JSON validation (jq) and better tool detection
        - Standardized `tooling/templates/plugin-template/` with correct JSON schema and documentation
    - **Operational Constitutions:**
        - Updated `CLAUDE.md` and `GEMINI.md` to enforce the new architecture and ban cross-repo hallucinations
        - Added "Co-Agents" definition (Jules & Gemini)

- **Claude GitHub Actions Opus model (2025-11-25):**
    - Updated `claude.yml` with `--model claude-opus-4-5-20251101`
    - Updated `claude-code-review.yml` with `--model claude-opus-4-5-20251101`

- **Claude as Permanent PR Reviewer (2025-11-25):**
    - Added section 4.5.1 to CLAUDE.md: "PR Review (Claude as Permanent Second Reviewer)"
    - Claude now reviews ALL pull requests alongside Jules
    - Defined review checklist: CI, CodeRabbit, Jules, Security, CHANGELOG
    - Standardized merge verdict format with explicit recommendation
    - Documented auto-merge tiers (Dependabot → CodeRabbit → Jules → Claude)

- **Workflow Orchestrator Agent (2025-11-25):**
    - `agents/workflow-orchestrator/` - New agent for pipeline coordination
        - `README.md` - Agent documentation and capabilities
        - `config/agent.json` - Agent configuration with pipeline definitions
        - `skills/workflow-orchestration/SKILL.md` - Orchestration skill
        - `scripts/orchestrate.sh` - CLI for pipeline execution
    - `docs/specs/spec-0005-workflow-orchestrator.md` - Feature specification
    - Pipelines: pre-commit, pr-create, ci-recover
    - Integrates: autonomous-ci, code-review, smart-commit, jules-integration
    - State awareness via CHANGELOG.md parsing

- **Jules AI integration (2025-11-25):**
    - `AGENTS.md` (repo root) - Context file for Jules and external agents
    - `plugins/jules-integration/` - New plugin for Google Jules AI delegation
        - `.claude-plugin/plugin.json` - Plugin manifest v0.1.0
        - `skills/jules-integration/SKILL.md` - When/how to delegate to Jules
        - `commands/jules.md` - `/jules` command for task creation
        - `scripts/jules-session.sh` - Shell script for API calls
        - `README.md` - Installation and usage documentation
    - `.github/workflows/jules-review.yml` - GitHub Actions workflow for Jules API
    - `agents/AGENTS_BASE.md` - Shared foundation prompt for all agents
    - `docs/specs/spec-0004-jules-integration.md` - Jules integration spec
    - `docs/decisions/ADR-0003-jules-agent-delegation.md` - Decision record
    - Updated `.claude-plugin/marketplace.json` with jules-integration plugin
    - **Key finding:** `jules.yml` does NOT exist; Jules reads `AGENTS.md`

- **Cross-repo contract specification (2025-11-25):**
    - `docs/specs/spec-0003-cross-repo-contracts.md` - Defines "THE LAW" for coordination with `ancplua-mcp`
    - Spec ID range allocation: 0001-0099 for plugins, 0100-0199 for mcp, 0200+ for cross-repo
    - ADR ID range allocation follows same pattern
    - Documented known violations in ancplua-mcp requiring remediation
    - Type A (Application) vs Type T (Technology) boundary definitions

- **Auto-merge system (2025-11-25):**
    - `.github/workflows/auto-merge.yml` - Tiered auto-merge workflow:
        - Tier 1: Dependabot PRs auto-approve + auto-merge (patch/minor only)
        - Tier 2: CodeRabbit approved PRs auto-merge
        - Tier 3: Placeholder for Jules agent integration
    - `.coderabbit.yaml` - CodeRabbit configuration with path-based review rules
    - Updated `.github/dependabot.yml`:
        - Added grouping (all GitHub Actions in single PR)
        - Added labels and commit prefixes
        - Scheduled for Monday 06:00 Europe/Vienna
        - Major npm versions require manual review
    - Enabled repo setting: `allow_auto_merge`
    - Branch protection on main: requires "Detect relevant changes" check

- **GitHub Actions version updates (2025-11-25):**
    - `actions/checkout`: v4 → v6
    - `actions/setup-node`: v4 → v6
    - `actions/upload-artifact`: v4 → v5
    - `github/codeql-action`: v3 → v4 (commented-out section)
    - Closed 4 stale Dependabot PRs (#1-#4) that were based on outdated ci.yml

- **CLAUDE.md mandatory CHANGELOG reading (2025-11-25):**
    - Added "Read CHANGELOG.md" as step 2 in MANDATORY FIRST ACTIONS (section 0)
    - Establishes temporal context early - prevents duplicate work, enables intelligent task sequencing
    - Renumbered subsequent steps (3-5)

- **CLAUDE.md CHANGELOG reminder (2025-11-25):**
    - Added prominent `EXTREMELY_IMPORTANT` callout in section 4.7 Documentation
    - Includes step-by-step CHANGELOG update instructions with format example
    - Emphasizes "NO EXCEPTIONS" - forgetting CHANGELOG = incomplete task

- **CI workflow optimization (2025-11-25):**
    - Disabled CodeQL job (no JavaScript/TypeScript code in repo)
    - Changed MegaLinter from `javascript` flavor to `documentation` flavor
    - Fixes CodeQL error: "no source code seen during build"

- **Plugin template improvements (2025-11-25):**
    - Rewrote `tooling/templates/plugin-template/README.md` for AI accessibility
    - Added complete file format examples (plugin.json, SKILL.md, commands, hooks)
    - Added validation checklist and links to existing plugins as patterns

### Removed

- **docs/FUTURE.md (2025-11-25):**
    - Removed roadmap document (superseded by specs, ADRs, and structured docs)
    - Updated references in README.md and CLAUDE.md

### Fixed

- **MCP server integration config portability (2025-11-28):**
    - Replaced hardcoded relative paths in `.mcp.json` with `${ANCPLUA_MCP_ROOT}` environment variable
    - Added `_note` field explaining environment variable configuration requirement
    - Enables portable configuration across different development machines

- **jules-auto-review.yml shellcheck/security fixes (2025-11-26):**
    - Fixed SC2086: Added double quotes around `$GITHUB_OUTPUT` variable expansions
    - Fixed script injection risk: Moved `github.event.pull_request.title` to env var
    - Added quotes around PR_NUMBER variable assignment

- **Repository cleanup (2025-11-26):**
    - Deleted stale `.mega-linter.yml` (MegaLinter removed from CI)
    - Deleted orphaned `.aiexclude` (undocumented)
    - Added `.idea/` and `.claude/settings.local.json` to .gitignore
    - Untracked `.idea/workspace.xml` from git
    - Updated `docs/specs/spec-template.md` to match actual spec structure
    - Updated `docs/decisions/adr-template.md` to match actual ADR structure
    - Expanded `tooling/templates/plugin-template/README.md` with comprehensive guidance

- **Full markdown/workflow compliance cleanup (2025-11-25):**
    - Fixed SC2086 shellcheck warnings in `jules-review.yml` (proper variable quoting)
    - Fixed MD013 line length issues in 6 files (wrapped to 120 chars)
    - Fixed MD036 emphasis-as-heading in `ADR-0003-jules-agent-delegation.md`
    - Fixed MD040 code block language specifiers (~20 files)
    - Fixed MD024 duplicate heading in CHANGELOG (renamed to include dates)
    - Configured MD060 table style as "padded" for consistency
    - Auto-fixed MD022, MD030, MD047 via `markdownlint --fix`
    - Validation now passes with **zero warnings**

- **Duplicate template files removed (2025-11-25):**
    - Removed `docs/specs/spec-0001-marketplace-framework.md` (was template with duplicate ID)
    - Cleaned up orphaned template files disguised as specs/ADRs

- **ADR consolidation (2025-11-25):**
    - Merged duplicate `ADR-0001-marketplace-layout.md` and `ADR-0001-repository-as-marketplace.md`
    - Created canonical `ADR-0001-marketplace-architecture.md`

- **SKILL.md frontmatter compliance (2025-11-25):**
    - Added YAML frontmatter to `skills/working-on-ancplua-plugins/SKILL.md`
    - Added frontmatter to `tooling/templates/plugin-template/skills/example-skill/SKILL.md`

- **Markdown lint fixes (2025-11-25):**
    - Fixed duplicate `### Fixed` headings in CHANGELOG.md (MD024)

### Added (previously)

- **New plugins with full implementations (2025-11-24):**
    - `smart-commit` plugin (transformed from `wip-plugin-2`):
        - `plugins/smart-commit/.claude-plugin/plugin.json` - Plugin manifest v0.1.0
        - `plugins/smart-commit/skills/smart-commit/SKILL.md` - Semantic commit message Skill
        - `plugins/smart-commit/commands/commit.md` - `/commit` slash command
        - `plugins/smart-commit/README.md` - Full documentation
    - `code-review` plugin (transformed from `wip-plugin-3`):
        - `plugins/code-review/.claude-plugin/plugin.json` - Plugin manifest v0.1.0
        - `plugins/code-review/skills/code-review/SKILL.md` - Code review Skill
        - `plugins/code-review/commands/review.md` - `/review` slash command
        - `plugins/code-review/README.md` - Full documentation
- **First agent stub (2025-11-24):**
    - `agents/repo-reviewer-agent/` - Autonomous repository health reviewer
        - `README.md` - Agent design, capabilities, and architecture
        - `config/agent.json` - Agent SDK configuration
- **New specifications (2025-11-24):**
    - `docs/specs/spec-0002-autonomous-ci-plugin.md` - Autonomous CI plugin spec
    - Reorganized `spec-0001-framework-architecture.md` from template
- **New ADRs (2025-11-24):**
    - `docs/decisions/ADR-0002-superpowers-composition.md` - Framework composition
    - Reorganized `ADR-0001-marketplace-layout.md` from template

### Changed (2025-11-24)

- Transformed WIP plugins into production-ready plugins (relates to spec-0002, ADR-0002):
    - `wip-plugin-2` → `smart-commit` with conventional commits support
    - `wip-plugin-3` → `code-review` with security, style, performance analysis
- Updated `marketplace.json` with new plugin names and descriptions

### Fixed (2025-11-24)

- **SKILL.md frontmatter compliance:**
    - Added required YAML frontmatter (`name`, `description`) to all SKILL.md files per official docs
    - `plugins/autonomous-ci/skills/autonomous-ci/SKILL.md`
    - `plugins/smart-commit/skills/smart-commit/SKILL.md`
    - `plugins/code-review/skills/code-review/SKILL.md`
    - Reference: <https://code.claude.com/docs/en/skills.md>

### Previously Added

- Expanded skill reference documentation:
    - `skills/working-on-ancplua-plugins/references/conventions.md` - Full naming and layout conventions
    - `skills/working-on-ancplua-plugins/references/testing.md` - Complete testing guide with prerequisites
    - `skills/working-on-ancplua-plugins/references/publishing.md` - Full plugin publishing workflow
- Added keywords to `plugins/autonomous-ci/.claude-plugin/plugin.json`

### Previously Changed

- MegaLinter integration in CI:
    - Added `megalinter` job to `.github/workflows/ci.yml` using javascript flavor v9.1.0
    - Created `.mega-linter.yml` configuration file with minimal baseline settings
    - Uploads MegaLinter reports as workflow artifacts
- Documentation files (completing the target architecture):
    - `docs/AGENTS.md` - Agent SDK documentation and planned agents
    - `docs/WORKFLOWS.md` - CI/CD and development workflows
    - `docs/FUTURE.md` - Roadmap and planned features
- Tooling scripts:
    - `tooling/scripts/sync-marketplace.sh` - Validates marketplace.json sync with plugins directory
- Enhanced plugin template with example files:
    - `tooling/templates/plugin-template/skills/example-skill/SKILL.md`
    - `tooling/templates/plugin-template/commands/example-command.md`
    - `tooling/templates/plugin-template/hooks/hooks.json`
    - `tooling/templates/plugin-template/scripts/example-script.sh`
- Proper spec and ADR files:
    - Renamed `spec-template.md` to `spec-0001-marketplace-framework.md` (actual spec)
    - Renamed `adr-template.md` to `ADR-0001-repository-as-marketplace.md` (actual ADR)
    - Created new empty `spec-template.md` and `adr-template.md` templates

### Previously Changed (Markdown/CI Optimization)

- Verified complete marketplace architecture alignment (Phase 0-12 execution 2025-11-24)
- Optimize Markdown for AI readability across docs:
    - docs/specs/spec-template.md and docs/decisions/adr-template.md: wrap metadata in YAML front matter fences for tool
      compatibility.
    - README.md: add an "At a glance" section with entry points and validation command.
    - CLAUDE.md: minor punctuation fix in a MUST NOT rule.
- Documented optional MCP server integration for plugins (README, CLAUDE.md, docs/PLUGINS.md, ADR/SPEC templates).

### Fixed (previous validations)

- Validation script issues:
    - Fixed shellcheck SC2038 warning in `tooling/scripts/local-validate.sh` by using find with -print0 and xargs -0
    - Replaced non-portable mapfile with find + xargs for broader shell compatibility
    - Fixed shellcheck SC2035 warnings in `plugins/autonomous-ci/scripts/verify-local.sh` for .sln glob patterns
- GitHub Actions workflow: Fixed actionlint error by moving CODECOV_TOKEN secret check from step-level if to job-level env
- Markdown formatting:
    - Created `.markdownlint.json` config with reasonable rules (120 char line length, 2-space list indent, dash style)
    - Auto-fixed 200+ markdown formatting issues across all documentation
    - Manually fixed remaining issues: code block languages, table formatting, duplicate CHANGELOG headings
- Plugin structure: Renamed skill directory from `autonomous-ci-verification` to `autonomous-ci` to match conventions
    - Updated `plugins/autonomous-ci/README.md` to reference new skill name
- Moved misplaced plugin READMEs from `tooling/scripts/plugins/` to correct `plugins/` locations
- WIP plugin structure:
    - Removed nested empty directories (`wip-plugin-2/wip-plugin-2/`, `wip-plugin-3/wip-plugin-3/`)
    - Added proper plugin directories (`skills/`, `commands/`, `hooks/`, `scripts/`) to wip-plugin-2 and wip-plugin-3

---

## [0.1.0] - 2025-11-21

### Added

- Initial **marketplace architecture** for `ancplua-claude-plugins`:
    - Root `.claude-plugin/marketplace.json` describing:
        - `autonomous-ci`
        - `future-plugin-2` (from `wip-plugin-2`)
        - `future-plugin-3` (from `wip-plugin-3`)
- `plugins/autonomous-ci/` plugin:
    - `.claude-plugin/plugin.json`
    - `skills/autonomous-ci/SKILL.md` – CI verification Skill
    - `scripts/verify-local.sh` – local test runner
    - `scripts/wait-for-ci.sh` – CI monitoring script
    - `commands/` and `hooks/` directories prepared for future use
- Repo-level Skill:
    - `skills/working-on-ancplua-plugins/SKILL.md`
    - References under `skills/working-on-ancplua-plugins/references/`:
        - `conventions.md`
        - `testing.md`
        - `publishing.md`
- Documentation set:
    - `docs/ARCHITECTURE.md`
    - `docs/PLUGINS.md`
    - `docs/AGENTS.md`
    - `docs/WORKFLOWS.md`
    - `docs/FUTURE.md`
- Tooling:
    - `tooling/scripts/local-validate.sh`
    - `tooling/scripts/sync-marketplace.sh`
    - `tooling/templates/plugin-template/` skeleton:
        - `README.md`
        - `.claude-plugin/plugin.json`
        - `skills/example-skill/SKILL.md`
        - `commands/example-command.md`
        - `hooks/hooks.json`
- CI / automation scaffolding:
    - `.github/workflows/ci.yml` (intended to run plugin validation, shell/markdown/workflow checks)
    - `.github/workflows/dependabot.yml` (intended to keep GitHub Actions and npm deps up to date)

### Changed

- Migrated `autonomous-ci-verification/` → `plugins/autonomous-ci/` within a structured plugin layout.
- Migrated:
    - `wip-plugin-2/` → `plugins/wip-plugin-2/`
    - `wip-plugin-3/` → `plugins/wip-plugin-3/`
      into the marketplace-oriented `plugins/` hierarchy.

### Fixed

- N/A for initial structured release.

---

## [0.0.1] - 2025-11-20

### Added

- Initial experimental layout with:
    - `autonomous-ci-verification/`
    - `wip-plugin-2/`
    - `wip-plugin-3/`
- Seed documentation and specs:
    - Early `CLAUDE.md`
    - Early `README.md`
    - Specifications `docs/specs/spec-template.md`
    - Architectural Decision Records (ADRs) in `docs/decisions/adr-template.md`
    - Requirements documents:
        - `RequirementsForAI.md`
        - `RequirementsForHumans.md`

### Changed

- N/A (first experimental commit series).

### Fixed

- N/A (first experimental commit series).
