---
description: Run the next ready stage of the elegance pipeline
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, Agent
---

Run the next ready stage of the elegance pipeline.

## Procedure

1. Check status:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] status
```

1. For each ready slot, render the prompt:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] prompt --role <role> --slot <slot>
```

1. Spawn the matching subagent with the rendered prompt as the task:
   - `scout-*` slots -> spawn `elegance-pipeline:elegance-scout` (or the exact fully qualified runtime ID if it differs)
   - `judge-*` slots -> spawn `elegance-pipeline:elegance-judge` (or the exact fully qualified runtime ID if it differs)
   - `planner-1` -> spawn `elegance-pipeline:elegance-planner`
   - `verifier-1` -> spawn `elegance-pipeline:elegance-verifier`
   - `implementer-1` -> spawn `elegance-pipeline:elegance-implementer`

2. After each agent completes, pipe its result to the state manager:

```bash
echo "<agent output>" | python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] submit \
  --role <role> --slot <slot> --stdin
```

1. Check status again and repeat for newly unlocked slots.

2. Stop when no more slots are ready or the pipeline is complete.

## Arguments

Pass `$ARGUMENTS` to control which stage to run:

- `scouts` — run only scout phase
- `judges` — run only judge phase
- `all` — run all phases sequentially (default)
- A specific slot like `scout-1` or `judge-2`

## Rules

- Never bypass stage gates
- Run scouts and judges in parallel (background agents)
- Run planner, verifier, implementer sequentially (foreground)
- If the verifier says no implementation is warranted, report that and stop
- Use a distinct `--state-dir` for each spec if you want dedicated teams in parallel
