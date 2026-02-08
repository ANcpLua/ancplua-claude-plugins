# Agents

This directory (`agents/`) contains **standalone agents** that consume plugins from this marketplace.

## Current Agents

| Agent                 | Description                                           | Status  |
| --------------------- | ----------------------------------------------------- | ------- |
| `cleanup-specialist`  | Zero-tolerance cleanup: no suppressions, no shortcuts | Deprecated (use exodia/hades skill) |
| `repo-reviewer-agent` | Reviews repository health and structure               | Planned (config only) |

## Plugin-Hosted Agents

These agents live inside their plugins under `plugins/<name>/agents/`:

| Plugin               | Agent                  | Description                              |
| -------------------- | ---------------------- | ---------------------------------------- |
| `metacognitive-guard`| `arch-reviewer`        | Architecture-focused competitive review  |
| `metacognitive-guard`| `impl-reviewer`        | Implementation-focused competitive review|
| `metacognitive-guard`| `deep-think-partner`   | Extended reasoning partner               |
| `otelwiki`           | `otel-guide`           | OpenTelemetry guidance                   |
| `otelwiki`           | `otel-librarian`       | OTel docs sync and validation            |
| `feature-dev`        | `code-architect`       | Feature architecture design              |
| `feature-dev`        | `code-explorer`        | Codebase analysis and tracing            |
| `feature-dev`        | `code-reviewer`        | Implementation review                    |
| `hookify`            | `conversation-analyzer`| Analyze conversations for hook patterns  |

## Structure

Each standalone agent under `agents/<agent-name>/` follows:

```text
agents/<agent-name>/
├── README.md
├── prompts/
│   └── system.md       # Agent system prompt
├── config/
│   └── agent.json      # Agent configuration
└── tests/
```

## Integration with Plugins

Agents consume plugins by:

1. Loading Skills at runtime
2. Calling MCP tools exposed by plugins or external servers
3. Using the Task tool with `subagent_type` matching the agent name

The separation of concerns:

- **Plugins** encode reusable behavior and Skills
- **Agents** orchestrate plugins and execute workflows
- **MCP servers** (in `ancplua-mcp`) expose tools for agents to call
