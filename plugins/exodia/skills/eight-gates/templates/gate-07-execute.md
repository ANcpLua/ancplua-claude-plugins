# Gate 7: 驚門 KYŌMON — EXECUTE

> Controlled implementation with verification loops.
> Parallelism exists, but it's disciplined parallelism:
> lanes own files, avoid collisions, and report back.
> Execution happens in small commits: implement → verify → checkpoint → continue.

## Entry Condition

- Gate 6 checkpoint exists (`checkpoint.sh verify 6`)
- Work queue cached in artifacts with ownership map and lane structure

## Execution Mode

Create a team for the execute phase. Lane workers are teammates who coordinate
via messaging and shared task list. Lead never implements — only assigns tasks,
evaluates gates, and manages team lifecycle.

**Setup:**

1. `TeamCreate`: team_name = `"eight-gates-execute"`, description = `"Gate 7 execution lanes"`
2. For each lane: create tasks via `TaskCreate` (from Gate 6 work queue)
3. Spawn lane workers as teammates: `Task` tool with `team_name="eight-gates-execute"`
4. Workers claim tasks via `TaskUpdate`, message blockers via `SendMessage`
5. After each lane completes: evaluate mini-gate, then spawn next lane's workers
6. After all lanes: `SendMessage type="shutdown_request"` to all, then `TeamDelete`

## Lane Execution (LAW 3)

1. Load work queue and dependency graph from Gate 6 artifacts
2. Group items with no dependencies → Lane 1 (all parallel)
3. Create tasks for Lane 1 via `TaskCreate` on the shared task list
4. Spawn ALL Lane 1 teammates in ONE message (`Task` with `team_name="eight-gates-execute"`)
5. Workers claim tasks via `TaskUpdate`, coordinate via `SendMessage`
6. When Lane 1 completes → evaluate mini-gate → spawn Lane 2 teammates
7. Repeat until all lanes complete

### Lane Worker Prompt

Spawn each lane worker via `Task` with `team_name="eight-gates-execute"`:

> You are **lane-worker-[N]**, a teammate in the `eight-gates-execute` team.
> SESSION: $SESSION_ID | LANE: [lane_number]
>
> TEAM COORDINATION:
>
> - Use `TaskUpdate` to claim tasks from the shared task list before starting work
> - Use `SendMessage` to report blockers or completed items to the lead
> - Use `SendMessage` to coordinate with other teammates if you need files they own
> - When you receive a `shutdown_request`, approve it
>
> YOUR FILES (exclusive ownership — only you touch these):
> [list from Gate 6 ownership map]
>
> RULES:
>
> 1. TDD for each item: Write failing test → minimal fix → verify pass → refactor
> 2. ONLY touch files in your ownership list
> 3. After each item: run `[build command]` and `[test command]`
> 4. If build/test fails: fix it before moving to next item
> 5. If you can't fix it: report the blocker via `SendMessage`, move to next item
>
> CONTEXT FROM EARLIER GATES:
> [Lead: inject relevant content from artifacts here.
> Use `session-state.sh artifact get "conventions"` for Gate 2 context.
> Filter Gate 3 findings to only those matching this worker's files.
> Include Gate 5 reflection notes for those findings.
> Teammates have NO conversation history — inject everything.]
>
> OUTPUT (per item — report via `SendMessage` to lead):
>
> ```text
> ITEM: [description]
> STATUS: DONE | BLOCKED | SKIPPED
> FILES CHANGED: [list with summary]
> TESTS: [added/modified, pass/fail]
> BUILD: PASS | FAIL
> BLOCKERS: [if any]
> ```

### Mini-Gate After Each Lane

```text
LANE [N] GATE:
+------------------------------------------+
| Items: [done]/[total]                    |
| Build: PASS | FAIL                       |
| Tests: [passing] / [total]              |
| Blockers: [count]                        |
+------------------------------------------+
| All done + build + tests → next lane     |
| Blockers → reassign or escalate          |
| Build fail → fix before next lane        |
+------------------------------------------+
```

### Mini-Checkpoint After Each Lane

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 7 "lane-[n]-complete" \
  "items_done=[n]/[total]" \
  "tests_passing=[n]" \
  "build=[PASS|FAIL]" \
  "blockers=[n]"
```

## Multi-Round Protocol

If context fills during execution (common for XL objectives):

### Session Handoff

```bash
# Copy checkpoint log to artifacts for resume (avoids ARG_MAX on large sessions)
cp .eight-gates/checkpoints.jsonl .eight-gates/artifacts/handoff-checkpoints.jsonl

# Record handoff decision
plugins/exodia/scripts/smart/session-state.sh decision "handoff-created" \
  "Context limit reached, checkpoint log preserved for resume"

# Extend session TTL if still active
plugins/exodia/scripts/smart/session-state.sh extend 3600
```

### Resume in New Session

```bash
# 1. Verify session
plugins/exodia/scripts/smart/session-state.sh validate

# 2. List completed lanes
plugins/exodia/scripts/smart/checkpoint.sh list | grep "lane-"

# 3. Resume from next incomplete lane
# Load work queue artifact, skip completed items
```

## Collision Avoidance

- File ownership from Gate 6 is absolute: one teammate per file
- If a work item needs files owned by another teammate → message the file owner via `SendMessage` to coordinate
- If two items unexpectedly need the same file → lead reassigns one to the file owner's teammate
- Teammates must NOT touch files outside their ownership list

## Output Schema

```json
{
  "gate": 7,
  "lanes_completed": 0,
  "lanes_total": 0,
  "items_done": 0,
  "items_total": 0,
  "items_blocked": 0,
  "tests_passing": 0,
  "tests_added": 0,
  "build": "PASS|FAIL",
  "iterations": 0
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 7 "execute-complete" \
  "items_done=[n]/[total]" \
  "items_blocked=[n]" \
  "tests_passing=[n]" \
  "build=[PASS|FAIL]" \
  "iterations=[n]"
```

**PROCEED** if all lanes complete + build passes + tests pass.
**ITERATE** if items remain → re-enter Gate 7 with remaining work queue.
**HALT** if build/test fail and diagnosis fails → escalate with full evidence.
