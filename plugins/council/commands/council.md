---
description: >-
  Invoke the council on any complex task. A Fable 5 captain — the session lead — decomposes, frames a
  research question, and runs the /deep-research dynamic workflow for a cited report. An Opus 5
  synthesizer reasons over the report; an Opus 5 clarity teammate gap-checks it and asks the
  synthesizer live follow-ups via SendMessage. An Opus 5 janitor flags bloat. The captain removes
  cuts and delivers.
argument-hint: [task description]
effort: high
allowed-tools: Bash, Read, Task, SendMessage
---

# /council [task]

Invoke the council on `[task]`.

## Requirements

Agent teams are experimental and **disabled by default**. This command needs them:

```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

Without it, no team is set up at session start, and the lead can neither spawn teammates nor
propose them. Check this first and fail loudly — a silent fallback to fire-and-forget subagents
removes the synthesizer↔clarity cross-talk that is the entire point of the council.

## When to use

- Question requires both cited evidence (research) and rigorous reasoning (logic)
- Answer needs gap-checking before delivery
- Task is complex enough that a single pass will miss something
- You want the synthesis reconciled live against the evidence before it ships

## How it runs

```text
captain = the session lead (Fable 5) — frames a research question
  │
  └── /deep-research <question>  (dynamic workflow — fans out searches, returns a cited report)
        │
        └── captain spawns teammates; the team forms on the first spawn
              │
              ├── synthesizer (Opus 5 teammate) reasons over the report + task
              └── clarity     (Opus 5 teammate) gap-checks the synthesis against the report
                    → asks synthesizer live follow-ups via SendMessage
                    → synthesizer responds in real time (reactive cross-pollination)
              │
              └── captain reads report + team messages → produces draft
                    │
                    └── janitor (Opus 5 teammate) → BLOAT_FLAG + CUTS via SendMessage
                          │
                          └── captain removes cuts → final output
                          │
                          └── shutdown requests; team dirs cleaned up on session exit
```

`/deep-research` is a dynamic workflow, not a live SendMessage teammate — it returns a report. The
live cross-pollination is between the synthesizer and clarity reconciling that report.

## Orchestration

1. **Preflight.** Verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. If unset, stop and say so.
2. **Decompose + frame the research question.** The captain breaks down `[task]` and frames one
   focused, answerable research question.
3. **Research = run the `/deep-research` dynamic workflow** on that question. It fans out web
   searches, cross-checks sources, and returns a single cited report. It is not a live teammate —
   wait for the report. If `/deep-research` is genuinely absent, fail loudly: "/deep-research
   workflow not available — install/enable it." Do not research inline; `/deep-research` is the
   plugin's declared and only research path.
4. **Spawn synthesizer:**
   - `Task: name="synthesizer", subagent_type="council:opus-synthesizer"`
   - The team forms implicitly on this first spawn. There is no create step.
   - It reasons over the `/deep-research` report + the task and posts its synthesis to the team.
5. **Spawn clarity** (synthesizer stays alive):
   - `Task: name="clarity", subagent_type="council:opus-clarity"`
   - Clarity gap-checks the synthesis against the report and messages the synthesizer for
     follow-ups; the synthesizer responds in real time. This is the reactive collaboration that
     justifies teammates over fire-and-forget subagents.
6. **When clarity converges:** send each a shutdown request. A teammate may reject one with an
   explanation — read it rather than forcing.
7. **Captain synthesizes** from the `/deep-research` report + all team messages into a draft answer.
8. **Spawn janitor:**
   - `Task: name="janitor", subagent_type="council:opus-janitor"`
   - Janitor sends `BLOAT_FLAG` + `CUTS` via `SendMessage`.
9. **Shut down janitor.**
10. **Captain applies cuts** → final output. No teardown step: team directories are removed
    automatically when the session ends.

**Why research is a workflow, not a teammate:**
`/deep-research` already fans out and cross-checks sources internally and returns a finished cited
report, so keeping it alive as a SendMessage teammate buys nothing. The live cross-pollination that
justifies teammates happens between the synthesizer and clarity: clarity asks "your conclusion sits
on a report GAP — can you re-ground it?" and the synthesizer answers in real time. Shutting them
down early saves tokens but eliminates that reactive reconciliation.

## Mechanics that constrain this design

These are properties of agent teams, not choices the plugin makes:

- **The lead is the main session and is fixed.** The captain cannot be spawned; it is a contract the
  session adopts (`agents/fable-captain.md`). Never spawn `council:fable-captain` as a teammate.
- **No nested teams.** Only the lead spawns teammates, which is why the captain must be the lead.
- **`TeamCreate` and `TeamDelete` no longer exist.** The team forms on first spawn and is cleaned up
  on session exit. The `team_name` input on the Task tool is accepted but ignored, so this command
  no longer passes it.
- **Teammates do not inherit the lead's `/model`.** Each teammate's model comes from its agent
  definition (`model: opus`), so the council stays Opus 5 under a Fable 5 lead regardless of the
  session's `/model`.
- **Teammates inherit the lead's effort level.** The `effort:` field in each agent file applies when
  that definition runs as an ordinary subagent; as a teammate, the lead's effort wins. Run the lead
  at `high` or above.
- **`skills` and `mcpServers` frontmatter is not applied to teammates.** They load skills and MCP
  servers from project and user settings like any session.
- **Teammates do not inherit the lead's conversation history.** Put the context in the spawn prompt.

## Usage

```text
/council explain why the weave-validate.sh script fails on missing plugin.json
/council what is the best way to structure CLAUDE.md for an orchestrator agent
/council review this architecture decision: [paste decision]
```

## When NOT to use

- Simple factual questions → just ask directly
- Single-file code edits → use feature-dev
- P0 bugs → use exodia:fix `<issue>` P0 maximum
- Cleanup tasks → use exodia:hades
- Sequential work, same-file edits, or heavy dependencies → a single session or plain subagents beat
  a team; teammates add coordination overhead and cost far more tokens

## Cost profile

| Agent | Model | Relative cost |
|-------|-------|---------------|
| captain (lead) | `fable` — Fable 5 | High (runs three times: frame + reconcile + synthesis) |
| /deep-research (dynamic workflow) | inherits the lead | High — fans out web searches and cross-checks sources, returns a cited report |
| opus-synthesizer | `opus` — Opus 5 | Medium-High (stays alive through clarity phase for follow-ups) |
| opus-clarity | `opus` — Opus 5 | Medium — gap-checks the synthesis, asks follow-ups, receives responses |
| opus-janitor | `opus` — Opus 5 | Minimal |

Each teammate is a separate Claude Code instance with its own context window, so cost scales
linearly with the number of live teammates — not with how much they say. Total: ~3x a single pass
plus the `/deep-research` workflow's own search fan-out. The cost buys a cited evidence base and
reactive cross-pollination between the synthesizer and clarity — real follow-up conversations
instead of one-shot reads.
