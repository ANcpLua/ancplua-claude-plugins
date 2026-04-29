# release-pilot

Drives the .NET release workflow for the four `ANcpLua` framework repos.
Detects pattern from the workflow file, dispatches to the right release
script, watches CI (with approval-gate awareness for environment-gated
repos), classifies failures with a narrow auto-fix allowlist.

## Files

| File                            | Purpose                                                                                  |
|---------------------------------|------------------------------------------------------------------------------------------|
| `commands/release-pilot.md`     | The `/release-pilot` slash command — orchestrator instructions                           |
| `bin/detect-pattern.sh`         | Reads `nuget-publish.yml` → `auto-bump` / `tag-with-gate` / `tag-direct`                 |
| `bin/git-tag-latest.sh`         | Latest semver `vX.Y.Z` tag on `origin` (handles annotated `^{}` suffix)                  |
| `bin/nuget-latest.sh`           | Latest stable semver for a package ID via `v3-flatcontainer`                             |
| `bin/next-version.sh`           | `max(latest-tag, latest-nuget) + patch+1`. Halts on out-of-band nuget.                   |
| `bin/release-auto-bump.sh`      | Pattern A: clean-tree check, push to main, return run ID                                 |
| `bin/release-tag-triggered.sh`  | Patterns B and C: clean-tree check, refuse retag, push tag, return run ID                |
| `bin/wait-for-approval.sh`      | Pattern B: poll `gh run view`, surface approval URL once, resume after approve           |
| `bin/classify-failure.sh`       | Reads `gh run view --log-failed`, returns `trivial-format` / `flake` / `hard`            |

## Three release patterns

**Pattern A — auto-bump on main push.** `ANcpLua.NET.Sdk` only. Workflow's
`compute_version` job runs `git describe`, bumps patch, stamps `999.9.9`
placeholder in `Sdk.props` at pack time. Deploy job has
`if: github.ref == 'refs/heads/main'` — **no manual approval, no environment**.
Push to main = release.

**Pattern B — tag + manual approval.** `ANcpLua.Roslyn.Utilities`,
`ANcpLua.Agents`. Hybrid trigger: pushes to main run CI without publishing
(`is_release=false`); tag pushes set `is_release=true`. Publish job has
`environment: nuget` which gates on **manual approval in the GitHub UI**.
The skill cannot bypass this — it surfaces the approval URL via
`wait-for-approval.sh` and resumes polling once approved.

**Pattern C — tag-direct.** `ANcpLua.Analyzers` only. `nuget-publish.yml`
triggers on tag push only; non-release CI runs in a separate `ci.yml`. No
environment gate — tag → publish directly.

## Ghost-tag rule (Patterns B and C)

A tag on a build-broken commit doesn't publish but stays on the remote.
**Never delete or reassign a remote tag.** Bump to next patch.
`bin/next-version.sh` enforces this by computing from
`max(remote-tag, nuget)`. `bin/release-tag-triggered.sh` refuses if the
target tag already exists locally or remotely.

The format-fix retry path in the command file calls `next-version.sh`
**again** after the auto-fix commit, so the format-fix release goes out as
the next patch instead of reusing the broken version.

## Hard-stop allowlist

Auto-fix runs **only** for `dotnet format whitespace` failures. Cap:
1 fix + 1 `gh run rerun --failed`. The user's global "fix at source, never
suppress" rule kills the broader allowlist (no auto-add `using`, no
auto-null-guards) — those usually indicate real issues.

`classify-failure.sh` hard-stops on:

- `NU1102` (package not found upstream — bootstrap chain violation)
- `NU1109` (CPM downgrade detected)
- `BannedApiTests`, `MtpDetectionTests`, `SourceGeneratorDefaultsTests` failures
- C# compile errors (`error CSnnnn`)
- Anything not matching the trivial-format pattern

## Manual-approval gate (Pattern B)

`Roslyn.Utilities` and `Agents` use `environment: nuget`. When `gh run watch`
sees a publish job in `waiting` status, that's the approval gate, not a
hang. `wait-for-approval.sh` detects this state via
`gh run view --json status` and prints the run URL once for the human.
Polling continues, so once approved the orchestrator picks up
automatically.

## Pre-flight diagnostics

`bin/next-version.sh` writes to stderr:

- `ghost-tag detected: tag=vX.Y.Z nuget=A.B.C — bumping past` — normal,
  the bump goes past the broken-commit tag.
- `WARNING: nuget=A.B.C ahead of tag=vX.Y.Z — out-of-band publish; investigate`
  — exits with code 2. Don't auto-bump past it; surface to human.

## Per-repo package map (why some IDs are excluded)

| Repo                       | PKGS used by `next-version.sh`                                                                 | Excluded                                                                                  |
|----------------------------|------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `ANcpLua.NET.Sdk`          | `.NET.Sdk`, `.NET.Sdk.Web`, `.NET.Sdk.Test`                                                    | —                                                                                         |
| `ANcpLua.Analyzers`        | `ANcpLua.Analyzers`                                                                            | —                                                                                         |
| `ANcpLua.Roslyn.Utilities` | `.Roslyn.Utilities`, `.Polyfills`, `.Sources`, `.Testing.Aot`, `.Testing`                      | —                                                                                         |
| `ANcpLua.Agents`           | `ANcpLua.Agents`                                                                               | `.Testing`, `.Testing.Workflows` — publish only at `X.Y.Z-preview.1` (NU5104), filtered out by stable regex |
