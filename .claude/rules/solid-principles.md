# SOLID Principles for Plugins

Apply these principles when designing or modifying plugins:

## Single Responsibility

Each plugin does ONE thing well:

| Plugin | Responsibility |
|--------|----------------|
| `exodia` | Multi-agent orchestration |
| `metacognitive-guard` | Cognitive safety (amplification, integrity, CI — one domain) |
| `otelwiki` | OpenTelemetry documentation |
| `hookify` | User-configurable behavior hooks |
| `feature-dev` | Guided feature development + code review |
| `dotnet-architecture-lint` | .NET build pattern enforcement |
| `ancplua-project-routing` | Cross-repo specialist agent routing |

**Anti-pattern:** A plugin that handles CI, commits, AND reviews simultaneously with no cohesion.

## Open/Closed

Extend via new skills/commands. Don't modify core plugin logic for edge cases.

## Liskov Substitution

Skills must be interchangeable within their category: any code-review skill accepts the same inputs.

## Interface Segregation

Only `plugin.json` + `README.md` are required. All other directories (`skills/`, `commands/`, `hooks/`, `agents/`) are optional.

## Dependency Inversion

Plugins orchestrate via Skills. Skills define the contract. MCP servers implement. Plugins never implement low-level operations.
