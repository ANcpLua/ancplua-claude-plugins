# council

Council for complex tasks. A **Fable 5 captain** — the session lead — plus the `/deep-research`
dynamic workflow and three **Opus 5** teammates that reconcile with each other live.

Each teammate's full behavioral identity is written inline in its `agents/*.md` file. When the
captain spawns it, that file is appended to the teammate's system prompt in its own fresh context
window — a distinct Opus 5 instance with its own cost (see the Cost profile in `commands/council.md`).
The agent *is* its definition.

## Requirements

Agent teams are experimental and disabled by default. Enable them before using `/council`:

```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

Without it the lead cannot spawn teammates, and the council's live cross-talk — the reason it exists
— cannot happen.

## Roster

| Agent | Model | Role |
|-------|-------|------|
| `fable-captain` | `fable` — Fable 5 | **Lead contract, not a spawnable teammate.** Decomposes task, frames the research question, runs /deep-research, synthesizes final answer |
| `/deep-research` | dynamic workflow | Evidence: fans out web searches, cross-checks sources, returns a cited report |
| `opus-synthesizer` | `opus` — Opus 5 | Logic, code, math over the report — shows all work |
| `opus-clarity` | `opus` — Opus 5 | Gaps, assumptions, misalignment — gap-checks the synthesis live |
| `opus-janitor` | `opus` — Opus 5 | Flags bloat, returns CUTS list — captain removes |

Models are declared as **aliases**, not pinned IDs. v1.x hard-coded `claude-opus-4-8` in 21 places
and rotted when the generation turned over; `opus` and `fable` track the current generation.

## Usage

```text
/council [your task]
```

## Why the captain is the lead

Agent teams fix the lead to the main session for its lifetime, and forbid nested teams — only the
lead can spawn teammates. A captain spawned *as* a teammate therefore could not spawn the
synthesizer, clarity, or janitor, and the council would deadlock.

So `agents/fable-captain.md` is a contract the main session adopts, not an agent you dispatch. It
lives in `agents/` so the roster reads as one piece; the file itself refuses to run if it detects it
was spawned as a teammate.

## How identity works

Each agent file contains its full behavioral identity inline — values, protocol, output format, and
what it never does. When the captain spawns a teammate from that definition, the definition's `tools`
allowlist and `model` are honored and its body is **appended** to the teammate's system prompt
rather than replacing it.

Three caveats worth knowing, because they change what a definition controls:

- **Teammates inherit the lead's effort level.** The `effort:` field applies when a definition runs
  as an ordinary subagent; as a teammate, the lead's effort wins. (v1.x advertised "differentiated
  effort" across the council — that was never true for teammates.)
- **`skills` and `mcpServers` frontmatter is not applied to teammates.** They load skills and MCP
  servers from project and user settings like any session.
- **`SendMessage` and the task tools are always available** to a teammate, even when `tools`
  restricts everything else.

One Opus 5 base spawned three times with different system prompts, under a Fable 5 lead, plus the
`/deep-research` workflow for evidence.

## Structure

```text
council/
├── .claude-plugin/plugin.json
├── agents/           # Inlined identity + model assignments
│   ├── fable-captain.md      # lead contract — never spawned
│   ├── opus-synthesizer.md
│   ├── opus-clarity.md
│   └── opus-janitor.md
├── commands/council.md
└── README.md
```
