---
description: >-
  Invoke the council on any complex task. Opus captain decomposes, frames a research question, and
  runs the /deep-research dynamic workflow for a cited report. An Opus synthesizer reasons over the
  report; an Opus clarity agent gap-checks it and asks the synthesizer live follow-ups via
  SendMessage. An Opus janitor flags bloat. Captain removes cuts and delivers.
argument-hint: [task description]
effort: high
allowed-tools: Bash, Read, Task, SendMessage, TeamCreate, TeamDelete
---

# /council [task]

Invoke the council on `[task]`.

## When to use

- Question requires both cited evidence (research) and rigorous reasoning (logic)
- Answer needs gap-checking before delivery
- Task is complex enough that a single pass will miss something
- You want the synthesis reconciled live against the evidence before it ships

## How it runs

```text
captain (lead) frames a research question
  │
  └── /deep-research <question>  (dynamic workflow — fans out searches, returns a cited report)
        │
        └── captain creates team "council" and hands the report to the teammates
              │
              ├── synthesizer (teammate) reasons over the report + task
              └── clarity     (teammate) gap-checks the synthesis against the report
                    → asks synthesizer live follow-ups via SendMessage
                    → synthesizer responds in real time (reactive cross-pollination)
              │
              └── captain reads report + team messages → produces draft
                    │
                    └── janitor (teammate) → BLOAT_FLAG + CUTS via SendMessage
                          │
                          └── captain removes cuts → final output
                          │
                          └── TeamDelete
```

`/deep-research` is a dynamic workflow, not a live SendMessage teammate — it returns a report. The
live cross-pollination is between the synthesizer and clarity reconciling that report.

## Orchestration

1. **Decompose + frame the research question.** Captain breaks down `[task]` and frames one focused,
   answerable research question.
2. **Research = run the `/deep-research` dynamic workflow** on that question. It fans out web
   searches, cross-checks sources, and returns a single cited report (the workflow inside the
   command). It is not a live teammate — wait for the report. If `/deep-research` is genuinely
   absent, fail loudly: "/deep-research workflow not available — install/enable it." Do not
   research inline; `/deep-research` is the plugin's declared and only research path.
3. **TeamCreate:** `team_name="council"`, description = "Council: [task summary]".
4. **Spawn synthesizer:**
   - `Task: team_name="council", name="synthesizer", subagent_type="council:opus-synthesizer"`
   - It reasons over the `/deep-research` report + the task and posts its synthesis to the team.
5. **Spawn clarity** (synthesizer stays alive):
   - `Task: team_name="council", name="clarity", subagent_type="council:opus-clarity"`
   - Clarity gap-checks the synthesis against the report and messages the synthesizer for
     follow-ups; the synthesizer responds in real time. This is the reactive collaboration that
     justifies Teams over fire-and-forget subagents.
6. **When clarity converges:** shutdown synthesizer + clarity
   (`SendMessage type="shutdown_request"` to each).
7. **Captain synthesizes** from the `/deep-research` report + all team messages into a draft answer.
8. **Spawn janitor:**
   - `Task: team_name="council", name="janitor", subagent_type="council:opus-janitor"`
   - Janitor sends `BLOAT_FLAG` + `CUTS` via `SendMessage`.
9. **Shutdown janitor** (`SendMessage type="shutdown_request"`).
10. **Captain applies cuts** → final output.
11. **TeamDelete** — clean up team.

**Why research is a workflow, not a teammate:**
`/deep-research` already fans out and cross-checks sources internally and returns a finished cited
report, so keeping it alive as a SendMessage teammate buys nothing. The live cross-pollination that
justifies Teams happens between the synthesizer and clarity: clarity asks "your conclusion sits on a
report GAP — can you re-ground it?" and the synthesizer answers in real time. Shutting them down
early saves tokens but eliminates that reactive reconciliation.

## Usage

```text
/council explain why the weave-validate.sh script fails on missing plugin.json
/council what is the best way to structure CLAUDE.md for an orchestrator agent
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
| opus-captain | claude-opus-4-8 | High (runs three times: frame + reconcile + synthesis) |
| /deep-research (dynamic workflow) | claude-opus-4-8 | High — fans out web searches and cross-checks sources, returns a cited report |
| opus-synthesizer | claude-opus-4-8 | Medium-High (stays alive through clarity phase for follow-ups) |
| opus-clarity | claude-opus-4-8 | Medium — gap-checks the synthesis, asks follow-ups, receives responses |
| opus-janitor | claude-opus-4-8 | Minimal |

Total: ~3x a single Opus pass plus the `/deep-research` workflow's own search fan-out. The cost buys
a cited evidence base from `/deep-research` and reactive cross-pollination between the synthesizer
and clarity — real follow-up conversations instead of one-shot reads.
