# release-pilot

Drives the release workflow for `ANcpLua.NET.Sdk`, `ANcpLua.Analyzers`,
`ANcpLua.Roslyn.Utilities`, and `ANcpLua.Agents`.

Detects the pattern from `.github/workflows/nuget-publish.yml`, dispatches
the right action, watches CI (with manual-approval-gate awareness),
classifies failures, never edits `<Version>` lines, never reassigns ghost
tags.

## Three patterns

| Pattern              | Repos                                       | Action                                                          |
|----------------------|---------------------------------------------|-----------------------------------------------------------------|
| **A — auto-bump**    | `ANcpLua.NET.Sdk`                           | `git push origin main` (CI computes version from `git describe`) |
| **B — tag-with-gate**| `ANcpLua.Roslyn.Utilities`, `ANcpLua.Agents`| `git tag vX.Y.Z && git push origin vX.Y.Z`, then approve in GitHub UI |
| **C — tag-direct**   | `ANcpLua.Analyzers`                         | `git tag vX.Y.Z && git push origin vX.Y.Z`                      |

**Never edits `<Version>` lines.** All four repos compute version from tags or NuGet at CI time.

## Ghost-tag handling (Patterns B and C)

A tag pointed at a build-broken commit doesn't publish but stays on the
remote. Never reassign — `bin/next-version.sh` computes
`max(remote-tag, nuget) + patch+1` and bumps past. After a format-fix
retry, the new tag goes on a new commit with the next patch number; the
ghost tag stays on the remote untouched.

## Manual-approval gate (Pattern B)

`Roslyn.Utilities` and `Agents` publish jobs use `environment: nuget`,
which requires a human click in the GitHub UI before publish runs.
`bin/wait-for-approval.sh` detects this state, prints the approval URL
once, and keeps polling — the orchestrator resumes once you approve.

## Failure handling

Narrow auto-fix allowlist: only `dotnet format whitespace` failures.
Cap: 1 auto-fix + 1 CI rerun. Anything else stops and reports.

Hard-stop signals (no auto-retry, surface immediately): `NU1102`, `NU1109`,
`BannedApiTests` / `MtpDetectionTests` / `SourceGeneratorDefaultsTests`
failures, C# compile errors.

## Usage

```text
/release-pilot
```

Run from inside one of the four framework repos. The skill detects the
pattern, runs pre-flight, and (for Patterns B/C) confirms the proposed
version with you before pushing the tag.
