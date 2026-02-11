# SOLID Principles for Plugins

Apply these principles when designing or modifying plugins:

## Single Responsibility

Each plugin should do ONE thing well:

- `autonomous-ci` -> CI verification only
- `code-review` -> Code analysis only
- `metacognitive-guard` -> Cognitive amplification (agents + hooks)
- `otelwiki` -> OpenTelemetry documentation only
- `dotnet-architecture-lint` -> .NET build patterns only
- `completion-integrity` -> Task completion quality only
- `hookify` -> User-configurable hooks
- `feature-dev` -> Guided feature development
- `exodia` -> Multi-agent workflow orchestration
- `ancplua-project-routing` -> Auto-routes to specialist agents

**Anti-pattern:** A plugin that handles CI, commits, AND reviews.

## Open/Closed

Plugins should be extensible without modification:

- Add new skills to extend behavior
- Use hooks for customization points
- Don't modify core plugin logic for edge cases

## Liskov Substitution

Skills must be interchangeable within their category:

- Any code-review skill should accept the same inputs
- Any commit skill should produce compatible outputs

## Interface Segregation

Don't force plugins to implement unused features:

- `hooks/` directory is optional
- `commands/` directory is optional
- Only require what's actually used

## Dependency Inversion

Plugins depend on abstractions (Skills), not concrete implementations:

- Skills define the contract
- MCP servers provide the implementation
- Plugins orchestrate, never implement low-level operations
