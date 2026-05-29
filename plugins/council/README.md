# council

Council for complex tasks. An Opus captain plus the `/deep-research` dynamic workflow and three Opus
teammates at differentiated effort.

Inspired by Grok 4.20's multi-agent architecture — same mechanism, adapted for Claude: each agent's
identity is defined directly in its `agents/*.md` file as inline content, loaded as passive context
from token 1. No activation cost. No "should I use this skill?" decision. The agent *is* its
definition.

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
what it never does. This is the passive context pattern: the identity is always present, not retrieved.

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
