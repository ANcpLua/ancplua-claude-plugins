# Agents

All agents live inside their plugins under `plugins/<name>/agents/`.

## Plugin-Hosted Agents

| Plugin | Agent | subagent_type | Description |
|--------|-------|---------------|-------------|
| `metacognitive-guard` | `arch-reviewer` | metacognitive-guard:arch-reviewer | Architecture-focused competitive review |
| `metacognitive-guard` | `impl-reviewer` | metacognitive-guard:impl-reviewer | Implementation-focused competitive review |
| `metacognitive-guard` | `deep-think-partner` | metacognitive-guard:deep-think-partner | Extended reasoning partner |
| `otelwiki` | `otel-guide` | otelwiki:otel-guide | OpenTelemetry guidance |
| `otelwiki` | `otel-librarian` | otelwiki:otel-librarian | OTel docs sync and validation |
| `feature-dev` | `code-architect` | feature-dev:code-architect | Feature architecture design |
| `feature-dev` | `code-explorer` | feature-dev:code-explorer | Codebase analysis and tracing |
| `feature-dev` | `code-reviewer` | feature-dev:code-reviewer | Implementation review |
| `hookify` | `conversation-analyzer` | hookify:conversation-analyzer | Analyze conversations for hook patterns |

## Usage

Spawn agents via the Task tool with `subagent_type` matching the agent identifier above.

The separation of concerns:
- **Plugins** encode reusable behavior and skills
- **Agents** orchestrate plugins and execute workflows
- **Exodia commands** compose agents into multi-agent pipelines (10 commands + hades skill, 23 commands total across all plugins)
