---
name: source-command-elegance-pipeline-run
description: Run the next ready stage of the elegance pipeline
---

# source-command-elegance-pipeline-run

Use this skill when the user asks to run the migrated Claude slash command `/elegance-pipeline:run`.

## Command Template

Run the next ready stage of the elegance pipeline.

## Procedure

1. Check status:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] status
```

2. For each ready slot, render the prompt:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] prompt --role <role> --slot <slot>
```

3. Spawn the matching subagent with the rendered prompt as the task:
   - `scout-*` slots -> spawn `elegance-pipeline:elegance-scout` (or the exact fully qualified runtime ID if it differs)
   - `judge-*` slots -> spawn `elegance-pipeline:elegance-judge` (or the exact fully qualified runtime ID if it differs)
   - `planner-1` -> spawn `elegance-pipeline:elegance-planner`
   - `verifier-1` -> spawn `elegance-pipeline:elegance-verifier`
   - `implementer-1` -> spawn `elegance-pipeline:elegance-implementer`

4. After each agent completes, pipe its result to the state manager:

```bash
echo "<agent output>" | python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py [--state-dir <dir>] submit \
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
- Use a distinct `--state-dir` for each spec if you want dedicated teams in parallel

## MANUAL MIGRATION REQUIRED

Migrated from Claude slash command `/elegance-pipeline:run` into a Codex skill. Invoke it as `$source-command-elegance-pipeline-run` and rewrite provider-specific runtime behavior before relying on it for unattended execution.

Claude argument placeholders like `$ARGUMENTS`, `$0`, or `$1` were preserved as text; replace them with explicit Codex instructions for the current task.

Review unsupported Claude slash-command metadata manually: `allowed-tools`, `disable-model-invocation`.
