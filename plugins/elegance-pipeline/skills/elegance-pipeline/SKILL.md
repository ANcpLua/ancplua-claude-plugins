---
name: elegance-pipeline
description: >-
  Run a persistent multi-agent code-elegance workflow with 4 scouts, 2 judges,
  1 planner, 1 verifier, and 1 gated implementer. Use when evaluating source-file
  elegance across a repository and optionally converting weaknesses into refactor work.
allowed-tools: Read, Grep, Glob, Bash, Agent
effort: high
---

# Elegance Pipeline

Multi-agent code-elegance workflow with persistent state and stage gates.

## Pipeline stages

```text
4 Scouts (parallel, sonnet) -> 2 Judges (parallel, opus) -> 1 Planner (opus)
  -> 1 Verifier (opus) -> 1 Implementer (gated, opus)
```

## State manager

All orchestration goes through the pipeline state manager:

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py <command>
```

Commands: `init`, `status`, `prompt`, `submit`, `signal`

## How to orchestrate

1. Run `status` to see which slots are ready
2. For each ready slot, run `prompt --role <role> --slot <slot>` to get the task prompt
3. Spawn the appropriate subagent (`elegance-scout`, `elegance-judge`, `elegance-planner`,
   `elegance-verifier`, or `elegance-implementer`) with the rendered prompt as the delegation message
4. After each agent completes, submit its output via the state manager
5. Run `status` again to see what unlocked
6. Repeat until the pipeline is complete or blocked

## Orchestration rules

- Scouts run in parallel (all 4 at once via background agents)
- Judges run in parallel after ALL scouts are submitted
- Planner runs after BOTH judges are submitted
- Verifier runs after the planner is submitted
- Implementer only runs when the implementation signal is READY
- Never bypass stage gates
- If the verifier says no implementation is warranted, stop

## Agent model mapping

| Role | Agent | Model | Access |
|------|-------|-------|--------|
| Scout | elegance-scout | sonnet | read-only |
| Judge | elegance-judge | opus | read-only |
| Planner | elegance-planner | opus | read-only |
| Verifier | elegance-verifier | opus | read-only |
| Implementer | elegance-implementer | opus | full edit |

## Manual signal override

```bash
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py signal on
python ${CLAUDE_PLUGIN_ROOT}/elegance_pipeline/pipeline.py signal off
```
