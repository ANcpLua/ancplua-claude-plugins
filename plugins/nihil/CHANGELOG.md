# Changelog

All notable changes to the Nihil plugin are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this plugin uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-06

Merges the original "pantheon" design (`feat/nihil-pantheon`) into the shipped
plugin instead of replacing it. The hook-enforced modes stay as the native plugin;
the five dynamic workflows ride along as summonable payload — they were never a
competing plugin mechanism, just a delivery format the manifest cannot register
directly. (See the head-to-head tournament that decided this: A won 6/7 dimensions
as the *plugin*, B won spec-fidelity decisively as the *original concept*.)

### Added

- Five first-principles **dynamic workflows** under `workflows/` (canonical payload):
  `nihil` (orchestrator), `nihil-maat` (review), `nihil-odin` (research),
  `nihil-shiva` (deletion), `nihil-athena` (restructure), plus `jsconfig.json`
  (disables TS checking of the workflow dialect). Not loaded as a plugin component —
  the manifest has no `workflows/` field — so they install via `/nihil:summon`.
- `/nihil:summon` command (`commands/summon.md`): copies the workflow scripts into
  the project's `.claude/workflows/` so they register as `/<name>` commands.
- Two doctrine skills: `nihil` (the first-principles transformation entry skill) and
  `absence-of-value-and-meaning-code-quality-review` (the standard `/nihil-maat`
  enforces).

### Changed

- **Namespaced the four specialist workflows** `maat`/`odin`/`shiva`/`athena` to
  `nihil-maat`/`nihil-odin`/`nihil-shiva`/`nihil-athena` so they do not register as
  bare global commands in a shared marketplace (resolves the pantheon spec's open
  decision #1). The orchestrator stays `/nihil`; its internal `workflow()` calls and
  all docs were updated to match.
- **Honest enforcement language.** The marketplace description no longer claims the
  hooks "block" out-of-mode actions; it now matches the README — a discipline aid
  with heuristic, fail-open command matching, not a security boundary.

## [0.1.0] - 2026-06-04

### Added

- Three namespaced workflows: `/nihil:review`, `/nihil:implement`, `/nihil:release`,
  each activating an enforced operating mode.
- Five read-only review agents: `evidence-auditor`, `duplication-hunter`,
  `abstraction-critic`, `boundary-reviewer`, `release-gatekeeper` (all restricted with
  `disallowedTools: Write, Edit, MultiEdit, NotebookEdit`).
- Hook enforcement:
  - `UserPromptExpansion` (`nihil-mode.py`) pins the session mode in
    `$CLAUDE_PLUGIN_DATA` (temp-dir fallback) and injects a mode banner.
  - `PreToolUse` (`nihil-pretooluse.py`) blocks mutating/release operations per the
    active mode, matched on `Write|Edit|MultiEdit|NotebookEdit|Bash`.
  - `Stop` (`nihil-stop.py`) blocks once per mode cycle when output is missing required
    structure (finding confidence/evidence, a verification section, or a release
    readiness/blockers section); loop-safe via `stop_hook_active` plus a one-shot flag.
- Shared `scripts/_nihil_state.py` helper: single source of truth for state location
  and session-id sanitization; all hooks fail open if it is unavailable.
- Required Nihil finding format and per-mode output templates baked into the skills.

[0.2.0]: https://github.com/ANcpLua/ancplua-claude-plugins/releases/tag/nihil--v0.2.0
[0.1.0]: https://github.com/ANcpLua/ancplua-claude-plugins/releases/tag/nihil--v0.1.0
