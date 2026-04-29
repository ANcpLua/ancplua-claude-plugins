# Changelog — release-pilot

## [0.2.0] — 2026-04-29

### Changed

- **Three patterns instead of two.** Earlier 0.1.0 lumped Analyzers,
  Roslyn.Utilities, and Agents under a single "tag-triggered" pattern,
  but those three diverge on the manual-approval gate:
  - **Pattern A — auto-bump**: `ANcpLua.NET.Sdk` (push to main publishes,
    no gate)
  - **Pattern B — tag-with-gate**: `ANcpLua.Roslyn.Utilities`, `ANcpLua.Agents`
    (tag publishes, `nuget` environment requires manual approval in UI)
  - **Pattern C — tag-direct**: `ANcpLua.Analyzers` (tag publishes, no gate;
    non-release CI runs in separate `ci.yml`)
- `bin/detect-pattern.sh` now emits `auto-bump` / `tag-with-gate` /
  `tag-direct` instead of the old `auto-bump` / `tag-triggered`.
- Format-fix retry path now bumps to next patch instead of deleting and
  reassigning the broken tag (per CLAUDE.md "nächste Patch-Version
  verwenden" rule). Ghost tags stay on the remote, untouched.

### Added

- `bin/wait-for-approval.sh` — Pattern B watcher. Polls
  `gh run view --json status,conclusion,url` every 15s. When publish job
  enters `waiting` (environment-gate paused), prints the approval URL once
  on stderr and keeps polling, so the orchestrator resumes automatically
  once the human approves. 30 min timeout (override via
  `WAIT_TIMEOUT_SEC`).
- Per-repo package map documentation in `CLAUDE.md` explaining why
  `ANcpLua.Agents.Testing` and `.Testing.Workflows` are excluded from PKGS
  (they publish at `X.Y.Z-preview.1` only — NU5104 forces the suffix
  because they depend on MAF prereleases — and the stable-version regex
  filters them out anyway).

## [0.1.0] — 2026-04-29

### Added

- Initial release. Slash command `/release-pilot` with bin scripts for
  pattern detection, version computation, release dispatch, and failure
  classification.
- Pattern A (push-to-main, `ANcpLua.NET.Sdk`) and Pattern B
  (tag-triggered, the other three) supported.
- Ghost-tag prevention: `bin/release-tag-triggered.sh` refuses to retag
  an existing tag; `bin/next-version.sh` bumps past
  `max(remote-tag, nuget)`.
- Narrow trivial allowlist: `dotnet format whitespace` only. Cap:
  1 auto-fix + 1 `gh run rerun --failed`.
- Manual-approval-gate awareness for `Roslyn.Utilities` and `Agents`
  (`environment: nuget`).
