# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Command namespacing**: Bare `/fix`, `/mega-swarm` etc. corrected to `/exodia:fix`, `/exodia:mega-swarm` across CLAUDE.md, AGENTS.md, exodia/README.md. Plugin commands are always namespaced in Claude Code
- **AGENTS.md stale counts**: "19 commands, 11 agents" → "20 commands, 9 agents" to match actual filesystem
- **README.md exodia comment**: "9 commands incl. hades" → "8 commands + hades cleanup skill" (hades is a skill, not a command)
- **check-hades-idle.sh jq guard**: Added `command -v jq` with sed fallback matching repo convention. Without guard, quality gate silently failed open if jq missing
- **project-routing.sh strict mode**: Added `set -euo pipefail` + fixed shebang to `#!/usr/bin/env bash`. Was the only script in repo without strict mode
- **Template README autocomplete guidance**: Removed false claim that `commands/` is required for autocomplete. Official docs mark `commands/` as legacy; `skills/` provides autocomplete natively

### Changed

- **turbo-fix: atomic TDD** (16→13 agents): Merged `test-writer` + `implementation-coder` into single `tdd-implementer` that owns RED→GREEN cycle atomically. Eliminates file conflict where parallel agents wrote to same source files. `docs-updater` marked read-only
- **batch-implement: explicit file ownership**: Implementers now declare `OWNED FILES:` and are forbidden from modifying shared registration files (DI, route tables, exports). All wiring centralized in `consistency-reviewer` Phase 3
- **red-blue-review: module-scoped defenders**: Changed Phase 2 from "1 defender per finding" to "1 defender per module" with grouped findings. Eliminates file conflict when multiple findings target the same module. Phase 3 re-attackers mirror the same grouping

### Fixed

- **struggle-detector was dead code**: Was reading Stop hook JSON metadata via stdin and grepping it for hedging patterns — never matched anything. Now reads `transcript_path` from hook input, extracts last assistant message from JSONL transcript, analyzes actual response text
- **struggle-detector output key**: Changed `hookSpecificOutput.additionalContext` to `systemMessage` — the field async hooks actually deliver on next turn
- **metacognitive-guard Stop hook not async**: `struggle-detector.sh` never blocks stopping (always exits 0) but was running synchronously. Now runs with `async: true`
- **otelwiki check-freshness.sh missing timeout**: No `timeout` field meant 600s (10 minute) default. Added `timeout: 5` matching sibling hook
- **hades TeammateIdle inline command using relative path**: `plugins/exodia/scripts/smart/ledger.sh` breaks if CWD isn't repo root. Extracted to `check-hades-idle.sh` script using `${CLAUDE_PLUGIN_ROOT}` for reliable path resolution
- **ancplua-project-routing redundant matcher**: SessionStart matcher `startup|resume|clear|compact` covers all 4 triggers — equivalent to no matcher. Removed
- **hades SKILL.md line length (MD013)**: Split 178-char goggles description line to fit 120-char limit

### Added

- **metacognitive-guard TaskCompleted hook**: Prompt-based (haiku, 15s) quality gate that validates task completions in team workflows aren't premature. Fires on every `TaskUpdate` to `completed` status
- **exodia check-hades-idle.sh**: Extracted script from hades SKILL.md inline `bash -c` command. Cleaner, debuggable, uses `${CLAUDE_PLUGIN_ROOT}` paths

### Removed

- **hades TaskCompleted prompt hook**: Duplicate of metacognitive-guard's generic TaskCompleted gate. Hades eliminators are already gated by TeammateIdle ledger check

### Changed

- **Plugin consolidation: 10 → 7 plugins** via three merges:
  - `completion-integrity` → absorbed into `metacognitive-guard` as PreToolUse hook on Bash (commit-integrity-hook.sh)
  - `autonomous-ci` → absorbed into `metacognitive-guard` as utility scripts (verify-local.sh, wait-for-ci.sh)
  - `code-review` → absorbed into `feature-dev` (skill, command, references)
- **metacognitive-guard v0.4.0**: Now includes 4 hooks (was 3), 7 scripts (was 3), absorbs commit integrity checking and CI verification
- **feature-dev v1.1.0**: Now includes `/review` command, `code-review` skill with references, and the full 7-phase workflow

### Removed

- **Standalone `completion-integrity` plugin**: Merged into metacognitive-guard as a PreToolUse hook
- **Standalone `autonomous-ci` plugin**: Merged into metacognitive-guard as utility scripts
- **Standalone `code-review` plugin**: Merged into feature-dev (skill + command + code-reviewer agent was already there)

### Added

- **Hades Goggles (Pink Glasses)**: Frontend design judgment enhancement for Hades cleanup skill.
  - Equip with `--goggles` or auto-equipped when scope contains frontend files (`.tsx`/`.jsx`/`.css`/`.html`/`.svelte`/`.vue`).
  - Adds 3 Opus 4.6 teammates (taste/spec/compliance) to Phase 0 audit.
  - Three-layer pipeline: frontend-design (aesthetic direction) → ui-ux-pro-max (measurable specs) → web-design-guidelines (implementation compliance).
  - Findings feed into Phase 1 elimination as design-violation tasks.
- **Hades smart targeting**: Auto-detects frontend files in scope and equips goggles without explicit `--goggles` flag
- **Goggles teammate templates**: `plugins/exodia/skills/hades/templates/goggles.md` — smart-goggles-taste, smart-goggles-spec, smart-goggles-compliance
- **CLAUDE.md routing**: Added frontend design quality audit routing to Hades --goggles

### Fixed

- **Hook timeout units**: Changed `timeout: 5000` (83 minutes) to `timeout: 5` (5 seconds) across metacognitive-guard, otelwiki, dotnet-architecture-lint hooks.json (6 occurrences)
- **Invalid `"stdin": "response"` field**: Removed from metacognitive-guard Stop hook — not a valid hook property, was silently ignored
- **Skill $N indexing**: Fixed 1-based to 0-based indexing across all 9 exodia skills (133 references). `$1`→`$0`, `$2`→`$1`, etc. per Claude Code spec
- **SessionStart hooks invalid JSON**: Fixed 3 scripts that embedded raw newlines in JSON string values — `inject-dotnet-rules.sh`, `truth-beacon.sh`, `project-routing.sh`. Now use `jq` when available, with `printf`/`sed` escaping fallback
- **dotnet CLI syntax**: Removed erroneous `--` separator and added `.slnx` preference in `verify-local.sh`
- **macOS flock compatibility**: Added `command -v flock` guard in `ledger.sh` matching the existing pattern in sibling `permit.sh`
- **README.md hades ghost**: Removed deleted hades plugin from plugin table and install commands
- **AGENTS.md false counts**: Fixed "12 plugins, 22 skills" → "11 plugins, 19 skills"
- **AGENTS.md stale hades routing**: Removed references to non-existent `hades/skills:{judge,enforce,verify}` and updated decision tree
- **copilot-instructions.md Quad-AI**: Was not updated in previous pass — now correctly says "Tri-AI" and "three AI agents"
- **CLAUDE.md Quad-AI heading**: Section 5.5.1 heading contradicted its own body — fixed to "Tri-AI"
- **README.md stale docs URL**: Updated from `docs.anthropic.com` to `code.claude.com/docs/en/plugins`

### Removed

- **Standalone hades plugin** (`plugins/hades/`): Redundant with `plugins/exodia/skills/hades/`
- **GEMINI.md**: Gemini removed as co-agent
- **Quad-AI references**: Downgraded to tri-AI (Claude, Copilot, CodeRabbit) across all files
- **Type A/Type T architecture**: Removed all Type A/Type T terminology and ancplua-mcp references across 15 files. ancplua-mcp project is discontinued
- **CLAUDE.md Section 10**: Removed entire MCP Integration / Dual-Repo Workflow section
- **copilot-instructions.md Section 3**: Removed entire "Type A vs Type T separation" section
- **docs/ARCHITECTURE.md**: Removed Sections 1 (Type A vs T), 5 (MCP integration), 7 (Relationship to ancplua-mcp); renumbered remaining sections
- **docs/PLUGINS.md**: Removed Type A/MCP paragraph
- **docs/AGENTS.md**: Removed ancplua-mcp MCP servers reference
- **spec-0003-cross-repo-contracts.md**: Deprecated — ancplua-mcp project discontinued
- **claude-code-review.yml**: Removed Type A/T references from review prompt
- **claude.yml**: Removed Type A comment
- **.gemini/styleguide.md**: Removed Type A/T identity and sister repo reference
- **.gemini/config.yaml**: Removed Type A comment
- **ancplua-project-routing**: Removed Type A/T labels, removed ancplua-mcp routing block from hook script, CLAUDE.md, README.md
- **weave-validate.sh**: Removed dual-repo mode (`--dual` flag, `SIBLING_REPO`, sibling validation)
- **plugin-template/README.md**: Removed MCP tools section referencing ancplua-mcp

### Added

- **Mega-swarm backlog**: `docs/mega-swarm-backlog.md` — P2/P3 issues for follow-up (18 medium, 14 low)
- **Claude multi-entity documentation**: CLAUDE.md section 2 now explains Claude as a multi-agent system
- **CCC tagline**: README now opens with "Claude, Copilot, CodeRabbit — the holy trinity"
- **Hades teammate prompt templates**: Extracted into `plugins/exodia/skills/hades/templates/`
- **Hades skill hooks**: `TeammateIdle` (command) and `TaskCompleted` (prompt/haiku)
- **Modular rule files**: `.claude/rules/` auto-loaded files

### Changed

- **Exodia hades skill**: Merged content from standalone hades, refactored to ~280 lines
- **CLAUDE.md**: Replaced sections 15-18 with `.claude/rules/` references
- **All hooks.json files**: Added `statusMessage` for spinner UX
- **metacognitive-guard hooks.json**: Combined `Write` + `Edit` into `Write|Edit` regex
- **dotnet-architecture-lint hooks.json**: Combined `Write` + `Edit` into `Write|Edit` regex
- **hookify hooks.json**: Added `async: true` to PostToolUse hook
- **arch-reviewer & impl-reviewer agents**: Added `memory: user`
- **weave-validate.sh**: Rewritten with hard failures vs soft warnings, proper exit codes
- **ci.yml**: Rewritten with 4 parallel jobs and real validation checks

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
