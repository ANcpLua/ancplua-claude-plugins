---
description: >-
  Invoke the five-agent council on any complex task. Opus captain decomposes and synthesizes.
  Researcher and synthesizer run in parallel and cross-pollinate via SendMessage.
  Clarity reads their output and asks follow-ups. Haiku janitor flags bloat. Captain removes cuts and delivers.
argument-hint: [task description]
---

# /council [task]

Invoke the council on `[task]`.

## When to use

- Question requires both evidence (research) and reasoning (logic) in parallel
- Answer needs gap-checking before delivery
- Task is complex enough that a single pass will miss something
- You want Opus judgment on top of Sonnet specialist work

## How it runs

```text
captain (lead) creates team "council"
  │
  ├── researcher   (teammate, parallel) ─┐
  └── synthesizer  (teammate, parallel) ─┤── cross-pollinate via SendMessage
  │                                       │
  │   captain waits for convergence       │
  │                                       │
  └── clarity (teammate) reads task list + messages researcher/synthesizer
        → flags GAPS/ASSUMPTIONS/MISALIGNMENT via SendMessage
  │
  └── captain reads all messages → produces draft
        │
        └── janitor (teammate) → BLOAT_FLAG + CUTS via SendMessage
              │
              └── captain removes cuts → final output
              │
              └── TeamDelete
```

## Orchestration

1. **TeamCreate:** `team_name="council"`, description = "Council: [task summary]"
2. **Spawn researcher + synthesizer** (both in ONE message, parallel):
   - `Task: team_name="council", name="researcher", subagent_type="council:sonnet-researcher"`
   - `Task: team_name="council", name="synthesizer", subagent_type="council:sonnet-synthesizer"`
   - They cross-pollinate via `SendMessage`: "My sources say X" / "That contradicts my reasoning on Y"
3. **Wait for convergence** — both go idle, no new messages for sustained period
4. **Spawn clarity** (researcher + synthesizer stay alive):
   - `Task: team_name="council", name="clarity", subagent_type="council:sonnet-clarity"`
   - Clarity reads team message history AND messages researcher/synthesizer for follow-ups
   - Researcher/synthesizer respond to clarifying questions in real time
5. **When clarity converges:** shutdown researcher + synthesizer + clarity
   (`SendMessage type="shutdown_request"` to each)
6. **Captain synthesizes** from all team messages into draft answer
7. **Spawn janitor:**
   - `Task: team_name="council", name="janitor", subagent_type="council:haiku-janitor"`
   - Janitor sends `BLOAT_FLAG` + `CUTS` via `SendMessage`
8. **Shutdown janitor** (`SendMessage type="shutdown_request"`)
9. **Captain applies cuts** → final output
10. **TeamDelete** — clean up team

**Why researcher + synthesizer stay alive through clarity:**
Clarity's value comes from asking follow-up questions — "Your source X contradicts synthesizer's
assumption Y, can you clarify?" — which requires live teammates. Shutting them down early
saves tokens but eliminates the reactive collaboration that justifies using Teams over
fire-and-forget subagents.

## Usage

```text
/council explain why the weave-validate.sh script fails on missing plugin.json
/council what is the best way to structure CLAUDE.md for a researcher agent
/council review this architecture decision: [paste decision]
```

## When NOT to use

- Simple factual questions → just ask directly
- Single-file code edits → use feature-dev
- P0 bugs → use exodia:turbo-fix
- Cleanup tasks → use exodia:hades

## Cost profile

| Agent | Model | Relative cost |
|-------|-------|---------------|
| opus-captain | opus-4.6 | High (runs three times: dispatch + clarity read + synthesis) |
| sonnet-researcher | sonnet-4.6 | Medium-High (stays alive through clarity phase for follow-ups) |
| sonnet-synthesizer | sonnet-4.6 | Medium-High (stays alive through clarity phase for follow-ups) |
| sonnet-clarity | sonnet-4.6 | Medium — reads output, asks follow-ups, receives responses |
| haiku-janitor | haiku-4.5 | Minimal |

Total: ~3x a single Opus pass. Higher than fire-and-forget (~2.5x) because researcher
and synthesizer stay alive through the clarity phase. The cost buys reactive
cross-pollination and real follow-up conversations instead of one-shot reads.
