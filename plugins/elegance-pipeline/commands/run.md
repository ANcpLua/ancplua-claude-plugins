---
description: Run the next ready stage of the elegance pipeline
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, Agent
---

Run the next ready stage of the elegance pipeline.

## Procedure

1. Check status:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py status
```

2. For each ready slot, render the prompt:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py prompt --role <role> --slot <slot>
```

3. Spawn the matching subagent with the rendered prompt as the task:
   - `scout-*` slots -> spawn `elegance-scout` agent (run all 4 in parallel as background agents)
   - `judge-*` slots -> spawn `elegance-judge` agent (run both in parallel as background agents)
   - `planner-1` -> spawn `elegance-planner` agent
   - `verifier-1` -> spawn `elegance-verifier` agent
   - `implementer-1` -> spawn `elegance-implementer` agent

4. After each agent completes, pipe its result to the state manager:

```bash
echo "<agent output>" | python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py submit \
  --role <role> --slot <slot> --stdin
```

5. Check status again and repeat for newly unlocked slots.

6. Stop when no more slots are ready or the pipeline is complete.

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
