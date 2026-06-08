# council

Council for complex tasks. An Opus captain plus the `/deep-research` dynamic workflow and three Opus
teammates at differentiated effort.

Inspired by Grok 4.20's multi-agent architecture — same mechanism, adapted for Claude: each agent's
full behavioral identity is written inline in its `agents/*.md` file. When the captain spawns that
agent with the Task tool, the file becomes the subagent's system prompt in its own fresh context
window — a distinct Opus invocation with its own cost (see the Cost profile in `commands/council.md`).
The agent *is* its definition.

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `opus-captain` | claude-opus-4-8 | Decomposes task, frames the research question, runs /deep-research, synthesizes final answer |
| `/deep-research` | dynamic workflow | Evidence: fans out web searches, cross-checks sources, returns a cited report |
| `opus-synthesizer` | claude-opus-4-8 | Logic, code, math over the report — shows all work |
| `opus-clarity` | claude-opus-4-8 | Gaps, assumptions, misalignment — gap-checks the synthesis live |
| `opus-janitor` | claude-opus-4-8 | Flags bloat, returns CUTS list — captain removes |

## Usage

```text
/council [your task]
```

## How identity works

Each agent file contains its full behavioral identity inline — values, protocol, output format, and
what it never does. When the captain Task-spawns an agent, that file is loaded as the subagent's
system prompt in a fresh context window of its own, so each spawn is a distinct Opus invocation.

Compare to Grok 4.20: same base model, several times, different system prompts. This is the same
thing — same Opus base, different agent definitions, plus the `/deep-research` workflow for evidence.

## Structure

```text
council/
├── .claude-plugin/plugin.json
├── agents/           # Agent definitions with inlined identity + model assignments
│   ├── opus-captain.md
│   ├── opus-synthesizer.md
│   ├── opus-clarity.md
│   └── opus-janitor.md
├── commands/council.md
└── README.md
```
