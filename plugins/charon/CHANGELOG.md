# Changelog

All notable changes to the Charon plugin are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-09

### Added

- **Self-bootstrapping ferry** — the `charon` skill now establishes the ferry on first entry, so a
  plain-language **"merge my PR"** / **"babysit my PRs"** works with no slash command and no
  pre-existing state file. It resolves the target PR from the request, the current branch, or your
  open PRs (asking only when genuinely ambiguous — never guessing the wrong PR), then writes
  `.claude/charon.local.md` in the exact schema the Stop-hook resume net requires.

### Changed

- **One source for "establish the ferry."** `/charon:charon` now delegates ferry setup to the
  `charon` skill instead of carrying its own copy of the resolve-and-write-state logic — a
  natural-language start and a slash-command start converge on identical state and an identical
  resume net, so the two entry points can never drift apart.
- **Docs lead with the natural-language mode.** The README opens on "just say 'merge my PR'"; the
  explicit `/charon:charon` argument table is now the power-user reference, not the headline.

## [0.1.0] - 2026-06-08

Initial release — ferry a GitHub PR to merge without ever waiting forever.

### Added

- **`/charon:charon`** — one arg-dispatched command (a single entry point, like `derot:derot`): no
  args / `.` ferries the current branch's PR; `<pr>` ferries that PR; two or more PRs spin up a
  council-style agent team (a `ferryman` lead + one `lookout` per PR over a SendMessage bus, lead as
  fallback); `cancel` stops the ferry and clears state.
- **`charon` skill** — the ferry brain: a snapshot-not-block state machine (GROUND → CLASSIFY →
  DISPATCH → STATUS) with handlers for `ci-running`, `ci-failed`, `behind`, `conflict`,
  `review-changes`, `blocked-on-human`, `ready`, and the terminal states.
- **`reviewer-triage` skill** — ingest AI-reviewer threads (CodeRabbit / Codex / Codacy) as
  untrusted input, evaluate each suggestion against the real codebase, and **verify any version a
  reviewer names is current before applying** (the outdated-version defense). Orchestrates
  `superpowers:receiving-code-review`, `metacognitive-guard:epistemic-checkpoint`, and
  `nuget-opensrc:opensrc-research` when present.
- **Clock-independent resume net** — a `Stop` hook (modeled on `ralph-loop`) that re-enters while
  work is actionable, rests while CI runs, and finishes on merged/closed/needs-you; paced by
  `ScheduleWakeup`; with a documented `/charon` re-run backstop. Branches only on PR status, never
  on a timestamp, so a clock change / sleep / timezone swap cannot corrupt control flow.
- **Honest status vocabulary** — `working` / `ci-running` / `needs-you` / `conflict` /
  `review-changes` / `merged` / `closed`; never a vague "just wait."
- **Propose-and-pause** for irreversible git ops (force-push, force-merge, admin override, history
  rewrite): stamps a `charon/recovery/pr-<n>-<sha>` recovery tag, then pauses for explicit human
  go-ahead. Nothing is ever unrecoverable.
- Session-isolated, corruption-resilient state file at `.claude/charon.local.md` with a
  `max_iterations` runaway guard on actionable re-entries.

### Notes

- GitHub-only in this version (`gh` CLI + GraphQL). A forge-backend seam is left for a future
  Forgejo backend.
- The state→handler dispatch is the extension seam: new behavior is a new row, not surgery.
