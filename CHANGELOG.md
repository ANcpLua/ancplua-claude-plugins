# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Type A/Type T architecture**: Removed ancplua-mcp dual-repo references, Section 10 MCP Integration, and Type A/T terminology. ancplua-mcp project is discontinued
- **CLAUDE.md Section 10**: Removed entire MCP Integration / Dual-Repo Workflow section

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
