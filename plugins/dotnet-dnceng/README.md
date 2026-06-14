# dotnet-dnceng

.NET engineering-infrastructure skills for investigating CI/CD failures across the
dotnet product repos (dotnet/runtime, dotnet/sdk, …): Helix logs, Azure DevOps
pipelines, binlogs, crash dumps, codeflow/dependency tracing, and Maestro.

**Vendored from [`dotnet/arcade-skills`](https://github.com/dotnet/arcade-skills)
(MIT)** — see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). The only change is
a one-character manifest fix (`agents` paths must start with `./`) required by
Claude Code's current plugin-manifest schema; everything else is upstream as of
commit `9a02ecae` (2026-06-10).

## Agent

- **`ci-investigator`** — router/orchestrator for CI failure investigations. Assesses
  the failure, delegates to the right skill(s), chains them, and synthesizes one
  combined report. *Use for* "investigate CI failures", "why is CI red and what
  should I do", complex multi-skill triage.

## Skills

| Skill | Purpose |
|-------|---------|
| `ci-analysis` | First-pass triage of a failed build/pipeline |
| `helix-investigation` | Deep analysis of Helix work-item logs |
| `pipeline-investigation` | Build / infrastructure (non-test) failures |
| `ci-crash-dump` | Crash-dump analysis |
| `binlog-failure-analysis` | MSBuild `.binlog` failure inspection |
| `known-issue-history` | Failure-trend / known-issue history |
| `flow-analysis` | Codeflow (VMR) PR health |
| `flow-tracing` | Dependency-flow tracing |
| `maestro-cli` | Maestro dependency-flow CLI usage |
| `test-arcade` | Arcade test/signing helpers |

## MCP servers

`hlx` (Helix), `binlog` (`Microsoft.AITools.BinlogMcp`), `mihubot`
(`https://mihubot.xyz/mcp`), and `maestro`. The `dotnet` / `binlog` servers resolve
their tools via `dotnet dnx` and the dnceng public NuGet feed on first use.

## Install

```text
/plugin   # enable dotnet-dnceng@ancplua-claude-plugins
```

## Upstreaming

This is a fork of an actively-maintained Microsoft repo. The clean long-term fix is
a one-line PR to `dotnet/arcade-skills` adding the `./` prefix; if/when that merges,
this vendored copy can be dropped in favor of installing their marketplace directly.
