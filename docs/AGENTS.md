# Agents

This directory (`agents/`) is reserved for **Agent SDK-based agents** that consume plugins from this marketplace.

## Concept

Agents are autonomous programs built with the Claude Agent SDK that can:

- Consume plugins from this marketplace
- Use Skills from `skills/` and `plugins/**/skills/`
- Perform complex, multi-step workflows
- Integrate with external systems via MCP servers

## Planned agents

| Agent                 | Description                                           | Status  |
| --------------------- | ----------------------------------------------------- | ------- |
| `repo-reviewer-agent` | Reviews code changes and provides feedback            | Planned |
| `ci-guardian-agent`   | Monitors CI runs and reports failures                 | Planned |
| `sandbox-agent`       | Isolated environment for testing plugin interactions  | Planned |

## Structure

Each agent under `agents/<agent-name>/` follows this pattern:

```text
agents/<agent-name>/
├── README.md
├── package.json        # or pyproject.toml
├── src/
│   └── index.ts        # or main.py
├── config/
│   └── agent.json
└── tests/
```

## Integration with plugins

Agents can use plugins by:

1. Installing plugins from this marketplace
2. Loading Skills at runtime
3. Calling MCP tools exposed by plugins or external servers

The separation of concerns:

- **Plugins** encode reusable behavior and Skills
- **Agents** orchestrate plugins and execute workflows
- **MCP servers** expose tools for agents and plugins to call

## Resources

- [Claude Agent SDK documentation](https://code.claude.com/docs/en/agent-sdk)
- [Plugin development guide](./PLUGINS.md)
- [MCP integration](./ARCHITECTURE.md#4-mcp-integration)
