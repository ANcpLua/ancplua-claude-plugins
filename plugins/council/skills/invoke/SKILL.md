---
name: invoke
description: >-
  Invoke the council. Spawns opus-captain who decomposes the task, dispatches
  sonnet-researcher + sonnet-synthesizer in parallel, then sonnet-clarity reads
  their raw output, then opus-captain synthesizes, then haiku-janitor cleans.
  Use for any task that benefits from parallel evidence + reasoning followed by
  gap-detection before the final answer.
---

# Council: Invoke

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

## Invoke

Spawn `opus-captain` with the full task. It handles the rest.

Pass in the spawn prompt:

```text
Task: [full task description]
Context: [any relevant files, URLs, prior conversation]
Output format: [what you expect back]
```

## Cost profile

| Agent | Model | Relative cost |
|-------|-------|---------------|
| opus-captain | opus-4.6 | High (runs three times: dispatch + clarity read + synthesis) |
| sonnet-researcher | sonnet-4.6 | Medium |
| sonnet-synthesizer | sonnet-4.6 | Medium |
| sonnet-clarity | sonnet-4.6 | Low — reads output, no tool calls |
| haiku-janitor | haiku-4.5 | Minimal |

Total: ~2.5× a single Opus pass. Researcher and synthesizer run in parallel,
clarity and haiku are lightweight sequential passes on their output.
