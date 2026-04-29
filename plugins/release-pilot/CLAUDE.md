# release-pilot

Drives the .NET release workflow for the four `ANcpLua` framework repos.
Detects pattern from the workflow file, dispatches to the right release
script, watches CI, classifies failures with a narrow auto-fix allowlist.

## Files

| File                            | Purpose                                                                                  |
|---------------------------------|------------------------------------------------------------------------------------------|
| `commands/release-pilot.md`     | The `/release-pilot` slash command — orchestrator instructions                           |
| `bin/detect-pattern.sh`         | Reads `.github/workflows/nuget-publish.yml` → `auto-bump` or `tag-triggered`             |
| `bin/git-tag-latest.sh`         | Latest semver `vX.Y.Z` tag on `origin` (handles annotated `^{}` suffix)                  |
| `bin/nuget-latest.sh`           | Latest stable semver for a package ID via `v3-flatcontainer`                             |
| `bin/next-version.sh`           | `max(latest-tag, latest-nuget) + patch+1`. Halts on out-of-band nuget.                   |
| `bin/release-auto-bump.sh`      | Pattern A: clean-tree check, push to main, return run ID                                 |
| `bin/release-tag-triggered.sh`  | Pattern B: clean-tree check, refuse retag, push tag, return run ID                       |
| `bin/classify-failure.sh`       | Reads `gh run view --log-failed`, returns `trivial-format` / `flake` / `hard`            |

## Two release patterns

**Pattern A — push-to-main publishes.** `ANcpLua.NET.Sdk` only. Workflow's
`compute_version` job runs `git describe`, bumps patch, stamps `999.9.9`
placeholder in `Version.props` at pack time. No file edits before push.

**Pattern B — tag-triggered.** `ANcpLua.Analyzers`, `ANcpLua.Roslyn.Utilities`,
`ANcpLua.Agents`. Version comes from `${GITHUB_REF_NAME#v}`. Code commits
to main do NOT publish — only tag pushes do.

## Ghost-tag rule (Pattern B)

A tag on a build-broken commit doesn't publish but stays on the remote.
**Never retag the same version.** Bump to next patch.
`bin/next-version.sh` enforces this by computing from
`max(remote-tag, nuget)`. `bin/release-tag-triggered.sh` refuses if the
target tag already exists locally or remotely.

## Hard-stop allowlist

Auto-fix runs **only** for `dotnet format whitespace` /
whitespace-verify failures. Cap: 1 fix + 1 `gh run rerun --failed`.
The user's global "fix at source, never suppress" rule kills the broader
allowlist (no auto-add `using`, no auto-null-guards) — those usually
indicate a real issue.

## Manual-approval gate

`Roslyn.Utilities` and `Agents` use `environment: nuget` which requires
human approval before the publish step runs. If `gh run watch` shows the
run paused there, that's expected — check the GitHub UI for the approval
prompt.

## Pre-flight diagnostics

`bin/next-version.sh` writes to stderr:

- `ghost-tag detected: tag=vX.Y.Z nuget=A.B.C — bumping past` — normal,
  the bump goes past the broken-commit tag.
- `WARNING: nuget=A.B.C ahead of tag=vX.Y.Z — out-of-band publish; investigate`
  — exits non-zero. Don't auto-bump past it; surface to human.
