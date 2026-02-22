# council

Five-agent council for complex tasks. Opus captain. Three Sonnet specialists. Haiku janitor.

Inspired by Grok 4.20's multi-agent architecture — same mechanism, adapted for Claude: each agent's
identity is defined directly in its `agents/*.md` file as inline content, loaded as passive context
from token 1. No activation cost. No "should I use this skill?" decision. The agent *is* its
definition.

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `opus-captain` | claude-opus-4-6 | Decomposes task, dispatches specialists, synthesizes final answer |
| `sonnet-researcher` | claude-sonnet-4-6 | Evidence, sources, verification — never speculates |
| `sonnet-synthesizer` | claude-sonnet-4-6 | Logic, code, math — shows all work |
| `sonnet-clarity` | claude-sonnet-4-6 | Gaps, assumptions, misalignment — runs after researcher + synthesizer |
| `haiku-janitor` | claude-haiku-4-5-20251001 | Flags bloat, returns CUTS list — captain removes |

## Usage

```text
/council [your task]
```

## How identity works

Each agent file contains its full behavioral identity inline — values, protocol, output format, and
what it never does. This is the passive context pattern: the identity is always present, not retrieved.

Compare to Grok 4.20: same base model, four times, different system prompts. This is the same thing —
same Sonnet base, different agent definitions.

## Structure

```text
council/
├── .claude-plugin/plugin.json
├── agents/           # Agent definitions with inlined identity + model assignments
│   ├── opus-captain.md
│   ├── sonnet-researcher.md
│   ├── sonnet-synthesizer.md
│   ├── sonnet-clarity.md
│   └── haiku-janitor.md
├── skills/invoke/SKILL.md
├── commands/council.md
└── README.md
```
