# Changelog

All notable changes to this project will be documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **MCP server integration config (2025-11-25):**
  - `.mcp.json` - Root config for ancplua-mcp server integration
  - Enables cross-repo consumption of MCP servers from `ancplua-mcp`
  - Servers: ancplua-workstation, ancplua-ai-services, ancplua-roslyn-metrics, ancplua-github-apps

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

### Changed

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
  - Specifications  `docs/specs/spec-template.md`
  - Architectural Decision Records (ADRs) in `docs/decisions/adr-template.md`
  - Requirements documents:
    - `RequirementsForAI.md`
    - `RequirementsForHumans.md`

### Changed

- N/A (first experimental commit series).

### Fixed

- N/A (first experimental commit series).
