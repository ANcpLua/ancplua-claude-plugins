# Changelog

All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- MegaLinter integration in CI:
  - Added `megalinter` job to `.github/workflows/ci.yml` using javascript flavor v9.1.0
  - Created `.mega-linter.yml` configuration file with minimal baseline settings
  - Uploads MegaLinter reports as workflow artifacts

### Changed

- Optimize Markdown for AI readability across docs:
  - docs/specs/spec-template.md and docs/decisions/adr-template.md: wrap metadata in YAML front matter fences for tool
      compatibility.
  - README.md: add an "At a glance" section with entry points and validation command.
  - CLAUDE.md: minor punctuation fix in a MUST NOT rule.
- Documented optional MCP server integration for plugins (README, CLAUDE.md, docs/PLUGINS.md, ADR/SPEC templates).

### Fixed

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
  - Specifications  `docs/specs/spec-template.md`
  - Architectural Decision Records (ADRs) in `docs/decisions/adr-template.md`
  - Requirements documents:
    - `RequirementsForAI.md`
    - `RequirementsForHumans.md`

### Changed

- N/A (first experimental commit series).

### Fixed

- N/A (first experimental commit series).
