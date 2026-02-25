# ancplua-project-routing

SessionStart hook that auto-routes Claude to specialist agents, commands, and skills based on `$PWD`.

## What It Injects

Each project gets a tailored context block containing:

- **Specialist agents** with exact `subagent_type` values for the Task tool
- **Key commands** from exodia, feature-dev, metacognitive-guard, dotnet-architecture-lint
- **Cross-repo dependency graph** (for .NET projects) with breaking change protocol
- **Project-specific patterns** and cautions

## Routing Table

| Directory Pattern | Context | Specialist Agents |
|-------------------|---------|-------------------|
| ErrorOrX | Generator work | erroror-generator-specialist, deep-debugger |
| ANcpLua.Analyzers | Roslyn diagnostics | ancplua-analyzers-specialist, deep-debugger |
| ANcpLua.NET.Sdk | MSBuild SDK | ancplua-sdk-specialist, msbuild-expert |
| ANcpLua.Roslyn.Utilities | Shared helpers (SOURCE OF TRUTH) | feature-dev agents + competitive-review |
| qyl | Observability platform (14 src projects) | qyl-observability-specialist, otel-genai-architect, servicedefaults-specialist |
| Template | Clean Architecture | template-clean-arch-specialist |
| ancplua-claude-plugins | Plugin marketplace | exodia, hookify commands |
| ancplua.io / ancplua-docs | Mintlify docs | ancplua-docs-generator |
| (unknown) | Default command list | -- |

## Cross-Repo Awareness

All .NET projects get a shared dependency graph showing how changes propagate:

```text
Roslyn.Utilities -> Analyzers, ErrorOrX, qyl generators
ANcpLua.NET.Sdk -> all .NET repos (auto-injects analyzers)
```

The Roslyn.Utilities route is the most guarded -- mandatory competitive review before any public API change.

## Files

| File | Purpose |
|------|---------|
| `hooks/hooks.json` | Declares SessionStart hook |
| `hooks/project-routing.sh` | Maps directory patterns to specialist context |
