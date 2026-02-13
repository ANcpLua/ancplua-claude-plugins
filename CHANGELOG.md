# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **hookify blocking rules shown 3x**: Removed duplicate `systemMessage` from blocking responses — `permissionDecisionReason` already carries the message
- **mtp-smart-test rule verbosity**: Trimmed 73-line reference doc to 5-line nudge — detailed MTP syntax belongs in `dotnet-mtp-advisor` agent, not a hook message
- **mtp-smart-test `# VERIFY` bypass**: Added missing `not_contains` condition so the documented bypass actually works

### Added

- **exodia findings auto-inherit**: SessionStart hook (`findings-inject.sh`) reads `.eight-gates/artifacts/findings.json` and injects as `<EXODIA_FINDINGS_CONTEXT>` passive context (LAW 1). STEP -1 added to all 9 commands + 2 skills — filters findings by scope, skips re-scanning. Producers: mega-swarm, eight-gates (Gate 3), hades (Phase 0). Consumers: everything else
- **exodia `baryon-mode` command**: One-shot .NET warning extermination. Phase 0 snapshots via `dotnet build`, then T0 burst launches up to 9 parallel agents (1 recon-invoker + 8 domain aspects). Cross-repo with full MCP access
- **exodia `eight-gates` skill**: Progressive discipline orchestration — 8 named gates (Kaimon→Shimon). Idempotent resume, TTL sessions, artifact caching, decision logging. Composes mega-swarm (MAP), fix pipelines (EXECUTE), and hades (HAKAI)
- **Hades Goggles (Pink Glasses)**: Frontend design judgment for Hades cleanup. Auto-equipped for `.tsx`/`.jsx`/`.css`/`.html`/`.svelte`/`.vue` files. Adds 3 teammates (taste/spec/compliance) to Phase 0 audit
- **metacognitive-guard TaskCompleted hook**: Prompt-based (haiku, 15s) quality gate for team workflow task completions
- **exodia `check-hades-idle.sh`**: Extracted from inline `bash -c` command. Uses `${CLAUDE_PLUGIN_ROOT}` paths
- **Mega-swarm backlog**: `docs/mega-swarm-backlog.md` — P2/P3 issues for follow-up
- **Claude multi-entity documentation**: CLAUDE.md section 2 explains Claude as a multi-agent system
- **CCC tagline**: README opens with "Claude, Copilot, CodeRabbit — the holy trinity"
- **Hades teammate prompt templates**: Extracted into `plugins/exodia/skills/hades/templates/`
- **Hades skill hooks**: `TeammateIdle` (command) and `TaskCompleted` (prompt/haiku)
- **Modular rule files**: `.claude/rules/` auto-loaded files
- **`checkpoint.sh` smart script**: Gate checkpoint management — init, save, load, verify (idempotent), list. Append-only JSONL storage
- **`session-state.sh` smart script**: TTL session state + artifact cache + decision log
- **`.eight-gates/` gitignore entry**: Session-local runtime directory

### Changed

- **eight-gates conductor identity**: Lead agent is the conductor (baton, not instrument). Delegation is intrinsic to self-concept. "A conductor who picks up a violin has stopped conducting."
- **eight-gates budget tracking removed**: Replaced all budget references with agent ceilings. Token costs tracked via OTel, not skills
- **exodia `eight-gates` promoted from command to skill**: Moved from `commands/eight-gates.md` (412 lines) to `skills/eight-gates/` (SKILL.md + 8 per-gate templates). Reviewer fixes: expanded `allowed-tools`, SSOT references, `.smart/` gitignore safety, fixed undefined functions/references in gate-02/04/06, added context injection in gate-05/07
- **metacognitive-guard `deep-analysis` command**: 4-phase structured thinking — decompose, adversarial review, implementation, verification
- **Docs sync**: Updated README.md, CLAUDE.md, ARCHITECTURE.md, AGENTS.md, marketplace.json with accurate counts (22 commands, 5 skills, 9 agents)
- **ARCHITECTURE.md rewrite**: Replaced stale target-state tree with actual filesystem layout. Removed phantom `skills/` root dir and `docs/examples/`
- **qyl routing rewrite**: Full project map (14 src projects), TypeSpec flow, specialist agents. Removed bloated Context Processing Requirement ceremony
- **turbo-fix: atomic TDD** (16→13 agents): Merged `test-writer` + `implementation-coder` into single `tdd-implementer`. Eliminates file conflict
- **batch-implement: explicit file ownership**: Implementers declare `OWNED FILES:`, wiring centralized in `consistency-reviewer` Phase 3
- **red-blue-review: module-scoped defenders**: Changed from "1 defender per finding" to "1 defender per module" with grouped findings
- **Plugin consolidation: 10 → 7 plugins**: `completion-integrity` → metacognitive-guard, `autonomous-ci` → metacognitive-guard, `code-review` → feature-dev
- **metacognitive-guard v0.4.0**: 4 hooks (was 3), 7 scripts (was 3), absorbs commit integrity + CI verification
- **feature-dev v1.1.0**: `/review` command, `code-review` skill, full 7-phase workflow
- **Exodia hades skill**: Merged content from standalone hades, refactored to ~280 lines
- **CLAUDE.md**: Replaced sections 15-18 with `.claude/rules/` references
- **All hooks.json files**: Added `statusMessage` for spinner UX
- **hooks.json regex**: Combined `Write` + `Edit` into `Write|Edit` regex across metacognitive-guard, dotnet-architecture-lint
- **hookify hooks.json**: Added `async: true` to PostToolUse hook
- **arch-reviewer & impl-reviewer agents**: Added `memory: user`
- **weave-validate.sh**: Rewritten with hard failures vs soft warnings, proper exit codes
- **ci.yml**: Rewritten with 4 parallel jobs and real validation checks

### Fixed

- **json_escape SSOT extraction**: Extracted canonical `json_escape()` into shared `scripts/smart/lib.sh` — eliminates 4 duplicate implementations. Fixes P0 multi-line JSONL corruption in ledger.sh
- **session-state.sh command injection**: Replaced raw variable interpolation with `--argjson` safe argument passing
- **checkpoint.sh verify accuracy**: Replaced brittle `grep` with `jq --argjson` exact match + session scoping
- **session-state.sh path traversal**: Added `validate_artifact_key()` guard rejecting keys with `/` or `..`
- **session-state.sh ls parsing**: Replaced `ls -1 | while read` with `find -print0 | while read -d ''`
- **checkpoint.sh session ID check**: Added existence guard before reading `.session-id`
- **json_escape newline handling**: Both scripts now use `jq -Rs` with `tr '\n' ' '` fallback
- **decision_log JSON safety**: Uses `jq -n -c --arg` instead of manual `json_escape` + `printf`
- **eight-gates.md quoting**: Quoted `$1` in `find` command, replaced `ls` with `find` for artifact counting
- **decision subcommand routing**: Added explicit `log` subcommand with graceful fallback
- **Command namespacing**: Bare `/fix`, `/mega-swarm` etc. corrected to `/exodia:fix`, `/exodia:mega-swarm` across docs
- **AGENTS.md stale counts**: "19 commands, 11 agents" → "20 commands, 9 agents"
- **README.md exodia comment**: "9 commands incl. hades" → "8 commands + hades cleanup skill"
- **check-hades-idle.sh jq guard**: Added `command -v jq` with sed fallback
- **project-routing.sh strict mode**: Added `set -euo pipefail` + fixed shebang
- **Template README autocomplete guidance**: Removed false claim that `commands/` is required
- **struggle-detector was dead code**: Now reads `transcript_path` from hook input and analyzes actual response text
- **struggle-detector output key**: Changed `additionalContext` to `systemMessage`
- **metacognitive-guard Stop hook not async**: Now runs with `async: true`
- **otelwiki check-freshness.sh missing timeout**: Added `timeout: 5`
- **hades TeammateIdle inline command**: Extracted to script using `${CLAUDE_PLUGIN_ROOT}` for reliable paths
- **ancplua-project-routing redundant matcher**: Removed matcher equivalent to no matcher
- **hades SKILL.md line length (MD013)**: Split 178-char line to fit 120-char limit
- **Hook timeout units**: Changed `timeout: 5000` (83 minutes) to `timeout: 5` (5 seconds) across 6 occurrences
- **Invalid `"stdin": "response"` field**: Removed from metacognitive-guard Stop hook
- **Skill $N indexing**: Fixed 1-based to 0-based across all 9 exodia skills (133 references)
- **SessionStart hooks invalid JSON**: Fixed 3 scripts embedding raw newlines in JSON
- **dotnet CLI syntax**: Removed erroneous `--` separator, added `.slnx` preference in `verify-local.sh`
- **macOS flock compatibility**: Added `command -v flock` guard in `ledger.sh`
- **README.md hades ghost**: Removed deleted hades plugin from table and install commands
- **AGENTS.md false counts**: Fixed "12 plugins, 22 skills" → "11 plugins, 19 skills"
- **AGENTS.md stale hades routing**: Removed references to non-existent `hades/skills:{judge,enforce,verify}`
- **copilot-instructions.md Quad-AI**: Fixed to "Tri-AI" and "three AI agents"
- **CLAUDE.md Quad-AI heading**: Fixed section 5.5.1 to "Tri-AI"
- **README.md stale docs URL**: Updated to `code.claude.com/docs/en/plugins`

### Removed

- **hades TaskCompleted prompt hook**: Duplicate of metacognitive-guard's generic gate
- **Standalone `completion-integrity` plugin**: Merged into metacognitive-guard
- **Standalone `autonomous-ci` plugin**: Merged into metacognitive-guard
- **Standalone `code-review` plugin**: Merged into feature-dev
- **Standalone hades plugin** (`plugins/hades/`): Redundant with `plugins/exodia/skills/hades/`
- **GEMINI.md**: Gemini removed as co-agent
- **Quad-AI references**: Downgraded to tri-AI across all files
- **Type A/Type T architecture**: Removed all references across 15 files. ancplua-mcp discontinued
- **CLAUDE.md Section 10**: Removed MCP Integration / Dual-Repo Workflow section
- **copilot-instructions.md Section 3**: Removed "Type A vs Type T separation" section
- **docs/ARCHITECTURE.md**: Removed Sections 1, 5, 7 (Type A/T, MCP, ancplua-mcp relationship)
- **docs/PLUGINS.md**: Removed Type A/MCP paragraph
- **docs/AGENTS.md**: Removed ancplua-mcp MCP servers reference
- **spec-0003-cross-repo-contracts.md**: Deprecated — ancplua-mcp discontinued
- **claude-code-review.yml**: Removed Type A/T references
- **claude.yml**: Removed Type A comment
- **.gemini/**: Removed Type A/T identity and sister repo references
- **ancplua-project-routing**: Removed Type A/T labels and ancplua-mcp routing
- **weave-validate.sh**: Removed dual-repo mode (`--dual` flag, `SIBLING_REPO`)
- **plugin-template/README.md**: Removed MCP tools section

## [1.0.0] - 2026-02-07

Launch release for Claude Opus 4.6. Full repository audit and cleanup.

### Added

- **CLAUDE.md for all 12 plugins**: Each plugin now has a focused CLAUDE.md with plugin-specific
  context (files, behavior, notes) that does not duplicate root CLAUDE.md content
  - autonomous-ci, code-review, completion-integrity, dotnet-architecture-lint, exodia,
    feature-dev, hades, hookify, metacognitive-guard, otelwiki, ancplua-project-routing,
    workflow-tools
- **CLAUDE.md for both agents**: cleanup-specialist (deprecated notice), repo-reviewer-agent (planned notice)
- **feature-dev README.md**: Plugin was missing its README entirely. Added 7-phase workflow overview

### Fixed

- **Exodia README version mismatch**: README said v1.0.0, plugin.json said v1.1.0. Updated README to v1.1.0
- **AGENTS.md plugin count**: Root and docs/AGENTS.md both said "11 plugins". Updated to 12, added
  exodia/hades skills to compressed docs index and decision tree
- **docs/PLUGINS.md**: Removed MCP server example that contradicted Type A architecture. Fixed
  script reference to `sync-marketplace.sh`. Added `agents/*.md` to optional components
- **docs/ARCHITECTURE.md**: Fixed plugin count (10 -> 12). Fixed stale compliance section that
  referenced non-existent "Section 8 of CLAUDE.md". Updated last verified date to 2026-02-07
- **docs/AGENTS.md**: repo-reviewer-agent status corrected from "Active" to "Planned (config only)"
- **Sync script misnamed**: `tooling/scripts/sync-otel-v1.51.0.sh` renamed to `sync-marketplace.sh`
  to match its actual purpose (marketplace validation, not OTel sync)

### Removed

- **7 dead .gitkeep files**: autonomous-ci (commands/, hooks/), code-review (root, commands/, hooks/,
  scripts/, skills/) - directories are empty or have real content
- **__pycache__ from dotnet-architecture-lint**: Bytecode cache was on disk (already gitignored)
- **Runtime state files from git**: metacognitive-guard `.blackboard/.struggle-count` and
  `.struggle-signals` removed from tracking. Added `.blackboard/` to .gitignore

### Changed

- **.gitignore**: Added `.blackboard/` pattern for metacognitive-guard runtime state
