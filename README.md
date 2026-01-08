# ancplua-claude-plugins

Alexander's lifetime Claude Code plugin marketplace. Plugins for CI verification, code review, cognitive amplification, and post-audit workflows.

## Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **autonomous-ci** | 0.1.0 | CI verification and monitoring. Local test runners and GitHub Actions monitoring. |
| **code-review** | 0.1.0 | Security scanning, style checking, and code improvement suggestions. |
| **metacognitive-guard** | 0.2.4 | Detects Claude struggling, escalates to deep-thinking agents. Includes arch-reviewer, impl-reviewer, and deep-think-partner agents. |
| **otelwiki** | 1.0.3 | OpenTelemetry documentation with auto-sync. 172 bundled doc files, semantic convention validation. |
| **ancplua-docs-librarian** | 1.0.0 | Documentation librarian for ANcpLua ecosystem (SDK, Analyzers, Roslyn Utilities). |
| **dotnet-architecture-lint** | 1.0.0 | .NET build pattern enforcement. Version.props symlinks, CPM, single-owner imports. |
| **completion-integrity** | 1.0.0 | Prevents task shortcuts. Blocks commits with warning suppressions, commented tests, deleted assertions. |
| **workflow-tools** | 1.0.1 | Post-audit workflows: mega-swarm (12 auditors), turbo-fix (16 agents), fix-pipeline, deep-think, batch-implement, tournament. |

## Installation

```bash
# Inside Claude Code
claude plugin install <plugin>@ancplua-claude-plugins

# Examples
claude plugin install metacognitive-guard@ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
claude plugin install otelwiki@ancplua-claude-plugins
```

Or from the interactive menu:

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install code-review@ancplua-claude-plugins
```

## Highlights

### metacognitive-guard

Detects when Claude is struggling (hedging, verbosity, contradictions) and escalates to deep-thinking agents. Achieves 3-4x token efficiency on complex questions.

```text
User asks complex architecture question
       |
       v
Claude responds with hedging/uncertainty
       |
       v
struggle-detector.sh detects patterns (score > 25)
       |
       v
deep-think-partner agent spawned (Opus model)
       |
       v
Structured, actionable recommendations
```

### workflow-tools

Post-audit commands for maximum parallelism:

| Command | Agents | Purpose |
|---------|--------|---------|
| `/tournament` | N+2 | Competitive coding - N agents compete, judge picks winner |
| `/mega-swarm` | 12 | Parallel audit - 12 specialized auditors simultaneously |
| `/turbo-fix` | 16 | Maximum parallelism fix pipeline (6+4+3+3 phased) |
| `/fix-pipeline` | 8 | Systematic fix pipeline (analysis, design, implement, verify) |
| `/deep-think` | 5 | Extended multi-perspective reasoning |
| `/batch-implement` | N+2 | Parallel implementation of similar items |

### otelwiki

Bundled OpenTelemetry documentation (172 files). Auto-triggers on telemetry work, validates semantic conventions.

```text
/otelwiki:sync   # Update bundled docs from upstream
```

## Architecture

**Type A (Application)** - This repo provides the "Brain" (plugins, skills, orchestration).

**Type T (Technology)** - Companion repo `ancplua-mcp` provides the "Hands" (MCP servers, tools).

```text
ancplua-claude-plugins/
├── plugins/              # 8 plugins
│   ├── autonomous-ci/
│   ├── code-review/
│   ├── metacognitive-guard/
│   ├── otelwiki/
│   ├── ancplua-docs-librarian/
│   ├── dotnet-architecture-lint/
│   ├── completion-integrity/
│   └── workflow-tools/
├── docs/                 # Architecture, specs, ADRs
└── tooling/              # Validation scripts
```

Rule: No MCP implementations here. This repo contains plugins, skills, and hooks only.

## External Plugins

This ecosystem works alongside plugins from other marketplaces:

| Source | Plugins |
|--------|---------|
| superpowers-marketplace | superpowers, episodic-memory, elements-of-style, double-shot-latte |
| claude-code-plugins | commit-commands, hookify, feature-dev |

## AI Review

PRs are reviewed by 5 AI agents:

| Agent | Reviews | Creates Fix PRs |
|-------|---------|-----------------|
| Claude | Yes | Yes |
| Jules | Yes | Yes |
| Copilot | Yes | Yes |
| Gemini | Yes | No |
| CodeRabbit | Yes | No |

## Key Files

| File | Purpose |
|------|---------|
| [CHANGELOG.md](CHANGELOG.md) | Version history and recent changes |
| [CLAUDE.md](CLAUDE.md) | Operational instructions for Claude |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) | Plugin registry |

## Documentation

- [Claude Code Plugins](https://docs.anthropic.com/en/docs/claude-code/plugins)
- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)

## License

[MIT](LICENSE)
