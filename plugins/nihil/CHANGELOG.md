# Changelog

All notable changes to the Nihil plugin are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this plugin uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-07-14

Token-diet and a hard operational lesson from the first 0.4.0 field runs.

### Changed

- **Shiva runs lean by default** (`workflows/shiva.js`): the sweep caps at
  `args.maxRounds` (default **2**, was 4) and exits after the first dry round
  (was 2); Prove agents run at `effort: 'medium'`, the manifest writer at
  `'low'`. A 38-agent run had burned ~1.25M subagent tokens; the sweep's later
  rounds and max-effort proving were the bulk of it. Pass `maxRounds` to widen.

### Fixed

- **Documented the cwd trap**: workflow subagents inherit the *session's*
  working directory, and no amount of scope prose retargets them — two field
  runs pointed at another repo via `args.scope` both audited the session repo
  instead. `whenToUse` now states: run `/nihil-shiva` from a session whose cwd
  IS the repo to audit; `args.scope` selects paths *inside* that repo only.

## [0.4.0] - 2026-07-14

Rebuilds Shiva's Prove phase from blind per-candidate refutation into a per-file
**usage census**, and teaches the sweep to hunt reimplementations of upstream APIs.

### Changed

- **Prove phase = usage census** (`workflows/shiva.js`). Candidates are grouped by
  file — one prover shares the Read/Grep context for everything in that file instead
  of N agents re-reading the same code — and each prover runs a fixed procedure:
  (1) usage census with inbound call-site counts (zero references is evidence;
  "I searched" is not), (2) **parameter audit** — a parameter unused in the body or
  passed the same value at every call site is independently removable
  (`narrow-params`) even when the callable stays, (3) **supersession** — read the
  referenced dependency's actual API before concluding it doesn't already ship this
  (`replace-with-upstream`), (4) **cohesion** — collapse similar-style twins, relocate
  single-caller helpers (`relocate`).
- **Verdicts carry an action** (`delete` | `narrow-params` | `replace-with-upstream` |
  `relocate` | `keep`) plus call-site counts and unused-parameter lists; the manifest
  gains sections for narrowings, upstream replacements, and relocations.
- **Execute applies `delete` and `narrow-params` only** (private, worktree-isolated).
  Upstream replacements and relocations join public breaks as human-sign-off items.
- **Doctrine**: survivors must be maximally cohesive, loosely coupled, expressive;
  never preserve a homegrown copy of what a dependency already ships; never create
  or tolerate near-identical names for different things (confusable names cause
  edits to land in the wrong artifact).

### Added

- **`upstream-reimplementation` finder**: homegrown helpers/targets/pipelines that
  duplicate a facility a referenced dependency or the platform already ships, and
  glue made obsolete by newer platform capabilities (e.g. credential-push plumbing
  superseded by trusted publishing).
- Parameter-level dead code (unused / never-varied parameters) added to the
  `dead-code` finder's hunt.

## [0.3.0] - 2026-06-06

Adds `/nihil:raze` — a fourth, write-capable mode for repositories you own — and a
universal secret / API-key brake. Inverts the plugin's default posture from "block your
own writes until you mode-juggle" to "free by default, with two brakes only". The other
three modes are unchanged; raze is the new one-line default for your own framework.

### Added

- **`/nihil:raze` (Raze Mode)** — root-authority, write-capable transformation. Edits,
  commits, pushes, tags, version bumps, publishing, public-API breaks, full rewrites,
  and deletion are all pre-authorized; no per-action sign-off. (`skills/raze/SKILL.md`,
  the `raze` banner in `nihil-mode.py`, enforcement in `nihil-pretooluse.py` /
  `nihil-stop.py`, and `raze` added to `VALID_MODES` in `_nihil_state.py`.)
- **Universal secret / API-key brake** in `nihil-pretooluse.py`, active in *every* mode
  (raze included): denies printing, echoing, committing, or passing a credential inline
  — `echo $TOKEN`, `cat .env`, `git add .env`, `--api-key <literal>`, and key literals
  (`AKIA…`, `ghp_…`, `-----BEGIN … PRIVATE KEY-----`). The plugin previously guarded no
  secrets at all.

### Changed

- **Canonical decision vocabulary.** The change-magnitude ladder in
  `skills/nihil/SKILL.md` is now the single source of truth for the `Nihil Decision:`
  tokens; `nihil.js` and `maat.js` were reduced to exact documented subsets (drift
  fixed: `rewrite` → `targeted rework`, `suggestions` → `suggestion`; `Public API
  correction` and `Ex Nihilo` retired as synonyms of `public API break` / `rebuild`).
  `shiva.js`'s tokens were already a valid subset.

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

[0.3.0]: https://github.com/ANcpLua/ancplua-claude-plugins/releases/tag/nihil--v0.3.0
[0.2.0]: https://github.com/ANcpLua/ancplua-claude-plugins/releases/tag/nihil--v0.2.0
[0.1.0]: https://github.com/ANcpLua/ancplua-claude-plugins/releases/tag/nihil--v0.1.0
