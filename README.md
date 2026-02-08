# ancplua-claude-plugins

Claude Code plugin marketplace. 12 plugins for CI, code review, cognitive amplification,
multi-agent orchestration, and audited cleanup.

## Plugins

| Plugin | Version | Description |
|--------|---------|-------------|
| **exodia** | 1.1.0 | Multi-agent orchestration as skills: fix, turbo-fix, fix-pipeline, tournament, mega-swarm, deep-think, batch-implement, red-blue-review, hades |
| **hades** | 2.0.0 | Unified enforcement: judge (4 auditors), enforce (4 eliminators), verify (4 verifiers). 12 teammates. |
| **metacognitive-guard** | 0.2.6 | Cognitive amplification: epistemic hooks, competitive review, fact-checking, deep-thinking agents |
| **workflow-tools** | 2.0.0 | Multi-agent commands: /fix, /red-blue-review, /tournament, /mega-swarm, /deep-think, /batch-implement |
| **otelwiki** | 1.0.6 | OpenTelemetry docs with auto-sync and semantic convention validation |
| **hookify** | 0.2.0 | User-configurable hooks from .local.md files |
| **feature-dev** | 1.0.0 | Guided feature development with codebase understanding |
| **dotnet-architecture-lint** | 1.0.2 | .NET build pattern enforcement (CPM, Version.props, symlinks) |
| **completion-integrity** | 1.0.0 | Blocks commits with warning suppressions, commented tests, deleted assertions |
| **code-review** | 0.1.0 | Security, style, performance analysis |
| **autonomous-ci** | 0.1.0 | CI verification and monitoring |
| **ancplua-project-routing** | 1.0.1 | Auto-routes to specialist agents by project directory |

## Install

```bash
claude plugin install exodia@ancplua-claude-plugins
claude plugin install hades@ancplua-claude-plugins
claude plugin install metacognitive-guard@ancplua-claude-plugins
claude plugin install workflow-tools@ancplua-claude-plugins
```

## Architecture

**Type A** repo — plugins, skills, hooks. No MCP servers (those live in `ancplua-mcp`).

Tri-AI review system: Claude, Copilot, CodeRabbit all review PRs independently.

```text
plugins/
├── exodia/                  # multi-agent orchestration (9 skills incl. hades cleanup)
├── metacognitive-guard/     # struggle detection + deep-think agents
├── workflow-tools/          # multi-agent commands (4/8 agent limits)
├── otelwiki/                # OTel docs + sync
├── hookify/                 # user-configurable hooks
├── feature-dev/             # guided feature development
├── dotnet-architecture-lint/# .NET build pattern enforcement
├── completion-integrity/    # prevents task shortcuts
├── code-review/             # security, style, performance
├── autonomous-ci/           # CI verification
└── ancplua-project-routing/ # project-aware agent routing
```

## Links

- [CHANGELOG](CHANGELOG.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Claude Code Plugins docs](https://docs.anthropic.com/en/docs/claude-code/plugins)

## License

[MIT](LICENSE)
