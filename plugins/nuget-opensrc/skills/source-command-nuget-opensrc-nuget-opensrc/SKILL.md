---
name: source-command-nuget-opensrc-nuget-opensrc
description: Resolve a NuGet package to its exact build commit and fetch source via opensrc
---

# source-command-nuget-opensrc-nuget-opensrc

Use this skill when the user asks to run the migrated Claude slash command `/nuget-opensrc:nuget-opensrc`.

## Command Template

# /nuget-opensrc

Resolve a NuGet package → GitHub repo + commit → fetch with opensrc.

Without this wrapper, `opensrc path dotnet/aspnetcore` returns the default branch (`main`) which drifts daily. With this wrapper, you grep the **exact commit** the package on NuGet was built from.

## Execution

```bash
"${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" path $ARGUMENTS
```

## Examples

```bash
# Latest published version
/nuget-opensrc Microsoft.Extensions.Logging

# Specific version (commit-pinned to what that version shipped)
/nuget-opensrc Microsoft.OpenTelemetry@1.0.2

# Inspect metadata without fetching
"${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" info Newtonsoft.Json
```

## Typical follow-up

After the command prints a path, grep into it:

```bash
rg "JwtBearerEvents" "$("${CLAUDE_PLUGIN_ROOT}/bin/nuget-opensrc" path Microsoft.AspNetCore.Authentication.JwtBearer)"
```

## When this fails

| Error | Meaning | Action |
|-------|---------|--------|
| `no <repository> metadata` | Publisher omitted the `<repository>` tag in nuspec | Source not accessible via this path — try `opensrc path <owner/repo>` directly if you know the repo |
| `repository.url is not github.com` | Package is on GitLab / Azure DevOps / etc. | Not supported (opensrc is GitHub-only) |
| `version not found` | Version doesn't exist in either NuGet feed (semver1 + gz-semver2 both checked) | Check spelling, drop `@version` for latest |

SemVer2-only versions (dotted prerelease like `9.0.0-preview.9.24556.5`, or `+`-build-metadata versions) are resolved transparently — the wrapper falls through from `registration5-semver1` to `registration5-gz-semver2` when needed.

The wrapper **never** falls back to `projectUrl` — that field lies for Microsoft packages (points at `https://dot.net/`). Failures are surfaced explicitly so you don't silently get wrong source.

## MANUAL MIGRATION REQUIRED

Migrated from Claude slash command `/nuget-opensrc:nuget-opensrc` into a Codex skill. Invoke it as `$source-command-nuget-opensrc-nuget-opensrc` and rewrite provider-specific runtime behavior before relying on it for unattended execution.

Claude argument placeholders like `$ARGUMENTS`, `$0`, or `$1` were preserved as text; replace them with explicit Codex instructions for the current task.

Review unsupported Claude slash-command metadata manually: `argument-hint`, `effort`.
