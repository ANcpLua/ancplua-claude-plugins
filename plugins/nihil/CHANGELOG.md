# Changelog

All notable changes to the Nihil plugin are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this plugin uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/ANcpLua/ancplua-claude-plugins/releases/tag/nihil--v0.1.0
