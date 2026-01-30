# ancplua-project-routing

Auto-routes Claude to specialist agents based on current project directory.

## What It Does

When you start a Claude Code session, this plugin checks your working directory and injects
context about which specialist agents to use for that project.

## Supported Projects

| Directory Contains | Routes To | Purpose |
|-------------------|-----------|---------|
| `ErrorOrX` | erroror-generator-specialist | Source generator work |
| `ANcpLua.Analyzers` | ancplua-analyzers-specialist | Roslyn diagnostics |
| `ANcpLua.NET.Sdk` | ancplua-sdk-specialist, msbuild-expert | MSBuild SDK |
| `ANcpLua.Roslyn.Utilities` | (careful!) | Shared Roslyn helpers |
| `qyl` | qyl-observability-specialist | AI observability |
| `ServiceDefaults` | servicedefaults-specialist | OTel instrumentation |
| `Template` | template-clean-arch-specialist | Clean Architecture |
| `ancplua-claude-plugins` | (Type A rules) | Plugin development |
| `ancplua-mcp` | (Type T rules) | MCP servers |

## Install

```bash
claude plugin install ancplua-project-routing@ancplua-claude-plugins
```

## How It Works

A SessionStart hook runs `project-routing.sh` which:
1. Checks `$PWD` for known project patterns
2. Injects routing context into the session
3. Shows which Task agents and Skills to use

## Cross-Repo Work

For work spanning multiple repos, use:
```
Skill → /ancplua-ecosystem
```

This loads the full ecosystem context with dependency hierarchy and source-of-truth locations.
