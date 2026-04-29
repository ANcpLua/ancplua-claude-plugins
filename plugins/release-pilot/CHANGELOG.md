# Changelog — release-pilot

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
