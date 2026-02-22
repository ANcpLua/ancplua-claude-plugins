---
description: >-
  Invoke the five-agent council on any complex task. Opus captain decomposes and synthesizes.
  Researcher and synthesizer run in parallel. Clarity reads their raw output.
  Haiku janitor flags bloat. Captain removes cuts and delivers.
---

# /council [task]

Invoke the council on `[task]`.

## What happens

1. `opus-captain` decomposes the task into structured subtasks
2. Dispatches in parallel:
   - `sonnet-researcher` — finds evidence, cites sources
   - `sonnet-synthesizer` — reasons through logic/code/math
3. `sonnet-clarity` reads researcher + synthesizer raw output — flags gaps,
   assumptions, and researcher/synthesizer conflicts
4. `opus-captain` reads all three, surfaces inconsistencies, produces draft
5. `haiku-janitor` returns BLOAT_FLAG + CUTS list
6. `opus-captain` removes cuts, delivers final answer

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
