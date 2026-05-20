---
description: Resolve a NuGet package to its exact build commit and fetch source via opensrc
effort: low
argument-hint: <Package.Id>[@<version>]
---

# /nuget-opensrc

Resolve a NuGet package → GitHub repo + commit → fetch with opensrc.

Without this wrapper, `opensrc path dotnet/aspnetcore` returns the default branch (`main`) which drifts daily. With this wrapper, you grep the **exact commit** the package on NuGet was built from.

## Execution

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" path $ARGUMENTS
```

## Examples

```bash
# Latest published version
/nuget-opensrc Microsoft.Extensions.Logging

# Specific version (commit-pinned to what that version shipped)
/nuget-opensrc Microsoft.OpenTelemetry@1.0.2

# Inspect metadata without fetching
node "${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" info Newtonsoft.Json
```

## Typical follow-up

After the command prints a path, grep into it:

```bash
rg "JwtBearerEvents" "$(node ${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc path Microsoft.AspNetCore.Authentication.JwtBearer)"
```

## When this fails

| Error | Meaning | Action |
|-------|---------|--------|
| `no <repository> metadata` | Publisher omitted the `<repository>` tag in nuspec | Source not accessible via this path — try `opensrc path <owner/repo>` directly if you know the repo |
| `repository.url is not github.com` | Package is on GitLab / Azure DevOps / etc. | Not supported (opensrc is GitHub-only) |
| `version not found` | Version doesn't exist in either NuGet feed | Check spelling, drop `@version` for latest |

The wrapper **never** falls back to `projectUrl` — that field lies for Microsoft packages (points at `https://dot.net/`). Failures are surfaced explicitly so you don't silently get wrong source.
