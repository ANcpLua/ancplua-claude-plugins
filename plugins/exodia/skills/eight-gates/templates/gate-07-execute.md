# Gate 7: 驚門 KYŌMON — EXECUTE

> Controlled implementation with verification loops.
> Parallelism exists, but it's disciplined parallelism:
> lanes own files, avoid collisions, and report back.
> Execution happens in small commits: implement → verify → checkpoint → continue.

## Entry Condition

- Gate 6 checkpoint exists (`checkpoint.sh verify 6`)
- Work queue cached in artifacts with ownership map and lane structure

## Execution Modes

### Mode A: Task Tool (S/M objectives — default)

Use the Task tool with subagents. One Task call per lane item. All items in a
lane launch in ONE message (parallel).

### Mode B: Agent Teams (L/XL objectives)

Use TeamCreate + delegate mode for complex, multi-round execution.
Teammates coordinate via messaging. Lead never implements — only assigns
tasks and evaluates gates.

```text
Use Mode B when:
- XL estimate (multi-round expected)
- Work queue has >8 items
- Lane depth >3 (complex dependency chains)
- Items require coordination (shared interfaces, data models)
```

## Lane Execution (LAW 3)

1. Load work queue and dependency graph from Gate 6 artifacts
2. Group items with no dependencies → Lane 1 (all parallel)
3. Launch ALL Lane 1 agents in ONE message
4. When Lane 1 completes → evaluate mini-gate → launch Lane 2
5. Repeat until all lanes complete

### Lane Worker Prompt

> subagent: general-purpose
>
> You are **lane-worker-[N]**.
> SESSION: $SESSION_ID | LANE: [lane_number]
>
> YOUR WORK ITEMS:
> [ordered list of items from Gate 6 work queue with descriptions]
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
> 5. If you can't fix it: report the blocker, move to next item
>
> CONTEXT FROM EARLIER GATES:
> [Lead: inject relevant content from artifacts here.
> Use `session-state.sh artifact get "conventions"` for Gate 2 context.
> Filter Gate 3 findings to only those matching this worker's files.
> Include Gate 5 reflection notes for those findings.
> Subagents have NO conversation history — inject everything.]
>
> OUTPUT (per item):
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

- File ownership from Gate 6 is absolute: one agent per file
- If a work item needs files owned by another agent → flag as dependency, defer to later lane
- If two items unexpectedly need the same file → lead reassigns one to the file owner's agent
- Agents must NOT touch files outside their ownership list

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
