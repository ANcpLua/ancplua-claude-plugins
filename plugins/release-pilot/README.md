# release-pilot

Drives the release workflow for `ANcpLua.NET.Sdk`, `ANcpLua.Analyzers`,
`ANcpLua.Roslyn.Utilities`, and `ANcpLua.Agents`.

Detects the pattern from `.github/workflows/nuget-publish.yml`, dispatches
the right action, watches CI, classifies failures.

## Two patterns

| Pattern              | Repos                                       | Action                                                          |
|----------------------|---------------------------------------------|-----------------------------------------------------------------|
| **A — push-to-main** | `ANcpLua.NET.Sdk`                           | `git push origin main` (CI computes version from `git describe`) |
| **B — tag-triggered**| Analyzers, Roslyn.Utilities, Agents         | `git tag vX.Y.Z && git push origin vX.Y.Z`                      |

**Never edits `<Version>` lines.** All four repos compute version from tags or NuGet at CI time.

## Ghost-tag handling (Pattern B)

A tag pointed at a build-broken commit doesn't publish but stays on the
remote. Never retag — `bin/next-version.sh` computes
`max(remote-tag, nuget) + patch+1` and bumps past.

## Failure handling

Narrow auto-fix allowlist: only `dotnet format whitespace` failures.
Cap: 1 auto-fix + 1 CI rerun. Anything else stops and reports.

## Usage

```text
/release-pilot
```

Run from inside one of the four framework repos. The skill detects the
pattern, runs pre-flight, and (for Pattern B) confirms the proposed
version with you before pushing the tag.

## Manual-approval gate

`Roslyn.Utilities` and `Agents` use a GitHub `nuget` environment with
manual approval. If the publish step pauses, that's expected — approve in
the GitHub UI.
