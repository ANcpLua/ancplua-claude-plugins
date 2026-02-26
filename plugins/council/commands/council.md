---
description: >-
  Invoke the five-agent council on any complex task. Opus captain decomposes and synthesizes.
  Researcher and synthesizer run in parallel. Clarity reads their raw output.
  Haiku janitor flags bloat. Captain removes cuts and delivers.
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
opus-captain receives task
  │
  ├── sonnet-researcher  (parallel) → FINDING/SOURCE/CONFIDENCE/GAPS
  └── sonnet-synthesizer (parallel) → REASONING/CONCLUSION/CONFIDENCE/BREAKS
  │
  └── sonnet-clarity reads researcher + synthesizer raw output
        → GAPS/ASSUMPTIONS/MISALIGNMENT/RESEARCHER_SYNTHESIZER_CONFLICT
  │
  └── opus-captain reads all three → produces draft answer
        │
        └── haiku-janitor → BLOAT_FLAG + CUTS list
              │
              └── opus-captain removes cuts → final output
```

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
| sonnet-researcher | sonnet-4.6 | Medium |
| sonnet-synthesizer | sonnet-4.6 | Medium |
| sonnet-clarity | sonnet-4.6 | Low — reads output, no tool calls |
| haiku-janitor | haiku-4.5 | Minimal |

Total: ~2.5x a single Opus pass. Researcher and synthesizer run in parallel,
clarity and haiku are lightweight sequential passes on their output.
