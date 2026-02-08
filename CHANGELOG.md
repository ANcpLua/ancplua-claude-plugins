# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Removed

- **Standalone hades plugin** (`plugins/hades/`): Redundant with `plugins/exodia/skills/hades/`. Standalone was disabled, depended on exodia's smart infrastructure, and had ~90% identical content. Removed from marketplace.json

### Changed

- **Exodia hades skill**: Merged useful content from standalone hades — scope determination via git diff, file ownership protocol for Phase 1 eliminators, independent verification for Phase 2 challenger
- **docs/ARCHITECTURE.md**: Plugin count 12 → 11

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
