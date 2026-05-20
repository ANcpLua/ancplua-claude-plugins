# nuget-opensrc

Commit-pinned NuGet → GitHub source fetcher for coding agents.

`opensrc` is great, but for bare GitHub repos it snaps to the default branch — which drifts daily. NuGet's catalog metadata carries the **exact commit** each package was built from. This plugin reads that commit and invokes `opensrc path owner/repo#<commit>` so you grep the source the package actually shipped, not whatever's on main.

## Why

```bash
# Without the wrapper:
opensrc path dotnet/aspnetcore
# → /Users/.../dotnet/aspnetcore/main         (drifts every push)

# With the wrapper:
node bin/nuget-opensrc path Microsoft.AspNetCore.Authentication.JwtBearer
# → /Users/.../dotnet/dotnet/<exact-commit>   (frozen at package build time)
```

For `Microsoft.OpenTelemetry@1.0.2` it resolves to:
```
microsoft/opentelemetry-distro-dotnet#63c50282ab99f176128e926e013330a19cde8454
```

## Components

| Component | Purpose |
|-----------|---------|
| `bin/nuget-opensrc` | Node CLI — resolve + fetch |
| `commands/nuget-opensrc.md` | Slash command — `/nuget-opensrc <Pkg>[@<ver>]` |
| `skills/opensrc-research/SKILL.md` | Autonomous skill — fires when verifying library behavior |

## Prerequisites

- **Node 18+** (uses built-in `fetch`)
- **opensrc** on PATH (`npm i -g opensrc`)
- **Internet access** to `api.nuget.org` and `github.com`

## Usage

### As a slash command (inside Claude Code)

```
/nuget-opensrc Microsoft.Extensions.Logging
/nuget-opensrc Microsoft.OpenTelemetry@1.0.2
```

### Direct CLI

```bash
# Fetch + print path
node bin/nuget-opensrc path Microsoft.Extensions.Logging

# Inspect metadata without fetching
node bin/nuget-opensrc info Newtonsoft.Json

# Help
node bin/nuget-opensrc --help
```

### Composed with ripgrep

```bash
rg "JwtBearerEvents" "$(node bin/nuget-opensrc path Microsoft.AspNetCore.Authentication.JwtBearer)"
```

## Design choices (justifications, not rationalizations)

| Choice | Why |
|--------|-----|
| Refuses to fall back to `projectUrl` | Microsoft packages have `projectUrl=https://dot.net/` which lies about source location. Silent fallback would silently corrupt research. |
| Refuses to silently default to `main` when commit is missing | Warns on stderr; you opt in to drift. |
| Tries `registration5-semver1` first, falls back to `registration5-gz-semver2` | semver1 is faster (plain JSON, smaller) but excludes SemVer2/prerelease packages; gz-semver2 is the superset. |
| Override-map for Microsoft monorepos *not* included | NuGet's `repository.url` is authoritative. Currently most Microsoft packages resolve to `dotnet/dotnet` (the unified Virtual Mono Repo) which is large but correct. Adding an override map would be a future optimization once disk-cost is measured. |
| Wrapped as a Claude Code plugin (not standalone npm package) | Distribution + skill auto-loading match how this is actually used. Standalone npm publish is a follow-up if needed. |

## Failures by design

These are errors, not silent fallbacks:

- `no <repository> metadata in nuspec` — publisher didn't tag the package with its source repo. You're stuck.
- `repository.url is ... (not github.com)` — package source is on GitLab/Azure DevOps/etc. opensrc is GitHub-only.
- `version not found` — version doesn't exist in either NuGet feed. Check spelling or drop `@version`.

## Limitations

- **NuGet packages must declare `<repository>` in nuspec.** Many older Microsoft packages and most third-party packages do. Packages predating SourceLink (~2018) often don't.
- **GitHub-only.** opensrc itself only fetches from GitHub. Packages whose source is on GitLab/Azure DevOps/Bitbucket are out of scope.
- **Disk cost.** `dotnet/dotnet` is the unified Virtual Mono Repo and clones at ~3-4 GB. The cache is in `~/.opensrc/`; use `opensrc list` and `opensrc remove` to manage.

## Testing the wrapper

```bash
# Happy path — Microsoft package with commit metadata
node bin/nuget-opensrc info Microsoft.OpenTelemetry@1.0.2
#  expect: repo=microsoft/opentelemetry-distro-dotnet
#          commit=63c50282ab99f176128e926e013330a19cde8454

# Happy path — fetch
node bin/nuget-opensrc path Microsoft.OpenTelemetry@1.0.2
#  expect: /Users/.../microsoft/opentelemetry-distro-dotnet/63c50282...

# Latest version
node bin/nuget-opensrc path Microsoft.Extensions.Logging
#  expect: /Users/.../dotnet/dotnet/<some-commit>

# Bad usage
node bin/nuget-opensrc
#  expect exit 0 with --help text

# Nonexistent package
node bin/nuget-opensrc path Nonexistent.Made.Up.Package.12345
#  expect: "package not found on NuGet" on stderr, exit 1
```

## License

MIT — see repository root.
