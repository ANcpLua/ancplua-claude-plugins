# ancplua-claude-plugins

> **CCC** — Claude, Copilot, CodeRabbit. The holy trinity. And two of them are Claude in a trenchcoat.

Claude Code plugin marketplace. 7 plugins for CI, code review, cognitive amplification,
multi-agent orchestration, and audited cleanup.

## Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **exodia** | 2.0.0 | Multi-agent orchestration: fix, turbo-fix, fix-pipeline, tournament, mega-swarm, deep-think, batch-implement, red-blue-review, hades |
| **metacognitive-guard** | 0.4.0 | Cognitive amplification: epistemic hooks, commit integrity, CI verification, competitive review, deep-thinking agents |
| **otelwiki** | 1.0.6 | OpenTelemetry docs with auto-sync and semantic convention validation |
| **hookify** | 0.2.0 | User-configurable hooks from .local.md files |
| **feature-dev** | 1.1.0 | Guided feature development with codebase understanding and integrated code review |
| **dotnet-architecture-lint** | 1.1.0 | .NET build pattern enforcement (CPM, Version.props, symlinks) |
| **ancplua-project-routing** | 2.0.0 | Cross-repo aware project routing with specialist agents and dependency graph |

## Install

```bash
claude plugin install exodia@ancplua-claude-plugins
claude plugin install metacognitive-guard@ancplua-claude-plugins
```

## Architecture

Plugins, skills, hooks. No MCP servers.

Tri-AI review system: Claude, Copilot, CodeRabbit all review PRs independently.

```text
plugins/
├── exodia/                  # multi-agent orchestration (8 commands + hades cleanup skill)
├── metacognitive-guard/     # struggle detection + deep-think + commit integrity + CI verification
├── otelwiki/                # OTel docs + sync
├── hookify/                 # user-configurable hooks
├── feature-dev/             # guided feature development + code review
├── dotnet-architecture-lint/# .NET build pattern enforcement
└── ancplua-project-routing/ # project-aware agent routing
```

## Links

- [CHANGELOG](CHANGELOG.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Claude Code Plugins docs](https://code.claude.com/docs/en/plugins)

## License

[MIT](LICENSE)
