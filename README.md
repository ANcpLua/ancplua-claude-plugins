# ancplua-claude-plugins

Claude Code plugin marketplace. 9 plugins for CI, code review, cognitive amplification, and workflows.

## Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **metacognitive-guard** | 0.2.4 | Detects Claude struggling, escalates to deep-thinking agents |
| **workflow-tools** | 1.0.1 | Parallel workflows: mega-swarm, turbo-fix, tournament |
| **otelwiki** | 1.0.4 | OpenTelemetry docs with auto-sync |
| **code-review** | 0.1.0 | Security, style, performance analysis |
| **autonomous-ci** | 0.1.0 | CI verification and monitoring |
| **dotnet-architecture-lint** | 1.0.0 | .NET build pattern enforcement |
| **completion-integrity** | 1.0.0 | Prevents task shortcuts |
| **hookify** | 0.2.0 | User-configurable hooks from .local.md |
| **feature-dev** | 0.1.0 | Guided feature development |

## Install

```bash
claude plugin install metacognitive-guard@ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
```

## Architecture

**Type A** repo - plugins, skills, hooks. No MCP servers (those live in `ancplua-mcp`).

```text
plugins/
├── metacognitive-guard/   # struggle detection + deep-think agents
├── workflow-tools/        # mega-swarm, turbo-fix, tournament
├── otelwiki/              # OTel docs + sync
├── code-review/
├── autonomous-ci/
├── dotnet-architecture-lint/
├── completion-integrity/
├── hookify/               # user-configurable hooks
└── feature-dev/           # guided feature development
```

## Links

- [CHANGELOG](CHANGELOG.md)
- [Claude Code Plugins docs](https://docs.anthropic.com/en/docs/claude-code/plugins)

## License

[MIT](LICENSE)
