# council

Four-model council for complex tasks. Opus captain. Three Sonnet specialists. Haiku janitor.

Inspired by Grok 4.20's 4-agent architecture — same mechanism, adapted for Claude: each agent's identity
lives in its soul file (`souls/`), loaded as passive context. No activation cost. No "should I use this
skill?" decision. The agent *is* its soul from token 1.

## Agents

| Agent | Model | Role |
|-------|-------|------|
| `opus-captain` | claude-opus-4-6 | Decomposes task, dispatches specialists, synthesizes final answer |
| `sonnet-researcher` | claude-sonnet-4-6 | Evidence, sources, verification — never speculates |
| `sonnet-synthesizer` | claude-sonnet-4-6 | Logic, code, math — shows all work |
| `sonnet-clarity` | claude-sonnet-4-6 | Gaps, assumptions, misalignment — blind-spot detection |
| `haiku-janitor` | claude-haiku-4-5 | Removes filler and redundancy from final output |

## Usage

```text
/council [your task]
```

## How identity works

Each agent loads its soul file on start — a dense CLAUDE.md that defines who it is, what it values,
what it never does, and how it formats output. This is the passive context pattern: the identity is
always present, not retrieved.

Compare to Grok 4.20: same base model, four times, different system prompts. This is the same thing —
same Sonnet base, different soul files.

## Structure

```text
council/
├── .claude-plugin/plugin.json
├── agents/           # Agent definitions with model assignments
├── souls/            # CLAUDE.md soul files — the actual identities
│   ├── opus-captain.md
│   ├── sonnet-researcher.md
│   ├── sonnet-synthesizer.md
│   ├── sonnet-clarity.md
│   └── haiku-janitor.md
├── skills/invoke/SKILL.md
├── commands/council.md
└── README.md
```
