# Future

This document tracks planned features, experiments, and extension points. Items here are aspirational and may change.

## Planned plugins

| Plugin             | Description                                        | Priority |
| ------------------ | -------------------------------------------------- | -------- |
| `code-review`      | Automated code review with Claude feedback         | High     |
| `documentation`    | Auto-generate docs from code                       | Medium   |
| `test-generation`  | Generate tests for existing code                   | Medium   |
| `refactoring`      | Suggest and apply refactoring patterns             | Low      |

## Planned agents

| Agent                 | Description                                     | Priority |
| --------------------- | ----------------------------------------------- | -------- |
| `repo-reviewer-agent` | Full repository review and feedback             | High     |
| `ci-guardian-agent`   | Monitor CI and alert on failures                | High     |
| `sandbox-agent`       | Isolated testing environment                    | Medium   |

## MCP integration

- Deeper integration with `ancplua-mcp` servers
- Additional MCP server implementations for specific workflows
- Cross-repo tool composition

## Skills library expansion

- More development workflow Skills
- Language-specific Skills (TypeScript, Python, C#, etc.)
- Framework-specific Skills (React, .NET, etc.)

## Tooling improvements

- Automated marketplace.json generation from plugins
- Plugin scaffolding CLI
- Version management and release automation
- Integration tests for plugins

## Experiments

This repo serves as a lab for:

- New Claude Code features as they become available
- Agent SDK patterns and best practices
- MCP server design patterns
- Cross-plugin composition strategies

## Contributing ideas

If you have ideas for new plugins, agents, or features:

1. Create a spec under `docs/specs/` describing the idea
2. Reference it in this file
3. Discuss with maintainers before implementation

---

**Note**: This is a living document. Items may be added, removed, or reprioritized as the ecosystem evolves.
