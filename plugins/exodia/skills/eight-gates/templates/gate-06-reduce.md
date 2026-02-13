# Gate 6: 景門 KEIMON — REDUCE

> Parallel work produces fragments. This gate merges them into one canonical queue.
> This is where contradictions are resolved and the kill list is born.
> Twelve agents each confidently doing different things is not progress — it's entropy.

## Entry Condition

- Gate 5 checkpoint exists with status "reflection-complete"
- MAP findings + reflection output available in artifacts

## Actions (0-1 Agents)

### 1. Merge All Findings

Collect outputs from Gate 3 (MAP) and Gate 5 (REFLECT):

- **Deduplicate:** Same file:line + same issue → merge, keep highest confidence
- **Resolve contradictions:** Agent A says X, Agent B says not-X → evidence wins.
  If evidence is equal, flag for manual resolution.
- **Apply reflection:** If reflection invalidated a finding → remove it.
  If reflection challenged a finding → lower its priority unless mini-test confirmed it.

### 2. Create Kill List

Work that should NOT be done, with explicit reasons:

| Kill Reason | Example | Action |
|-------------|---------|--------|
| Out of scope | Finding in file not in Gate 1 scope | Drop |
| False positive | Reflection mini-test disproved it | Drop |
| Low ROI | P3 finding, high effort, low impact | Drop |
| Blocked | Depends on external change we can't make | Park |
| Premature | Needs design decision first | Escalate |
| Duplicate | Same root cause as another finding | Merge |

The kill list is an artifact. It's evidence of discipline, not laziness.

```bash
# Lead: inject the kill list JSON you built above as a string here
plugins/exodia/scripts/smart/session-state.sh artifact add "kill-list" \
  "KILL_LIST_JSON_HERE"
```

### 3. Prioritize Remaining Work

Order by: severity → confidence → effort → dependencies

```text
WORK QUEUE (ordered):
1. [P0] Fix X in file A (owner: agent-1) — depends on: nothing
2. [P0] Fix Y in file B (owner: agent-2) — depends on: nothing
3. [P1] Refactor Z in file C (owner: agent-3) — depends on: #1
4. [P1] Add test for W in file D (owner: agent-2) — depends on: #2
...

KILLED:
- [P3] Cosmetic fix in file E — low ROI (3h effort, no user impact)
- [P2] Issue in file F — out of scope per Gate 1
- [P1] Duplicate of #3 — same root cause
```

### 4. Assign File Ownership

One agent per file. No overlaps. Lead resolves conflicts.

```text
OWNERSHIP MAP:
  agent-1: [file A, file G]
  agent-2: [file B, file D, file H]
  agent-3: [file C]
```

If two work items touch the same file → assign both to the same agent.

### 5. Build Dependency Graph + Lanes

Group work items by dependencies (LAW 3):

```text
Lane 1 (parallel): #1, #2     — no dependencies
Lane 2 (parallel): #3, #4     — depend on Lane 1
Lane 3 (sequential): #5       — depends on #3
```

### 6. Create Verification Plan

What must pass after implementation:

```text
VERIFICATION:
- [ ] Build passes (zero warnings)
- [ ] All existing tests pass
- [ ] New tests for each P0/P1 fix
- [ ] Lint clean
- [ ] [repo-specific validation]
```

### 7. Cache Final Work Queue

```bash
# Lead: inject the finalized work queue JSON you built above as a string here
plugins/exodia/scripts/smart/session-state.sh artifact add "work-queue" \
  "WORK_QUEUE_JSON_HERE"

plugins/exodia/scripts/smart/session-state.sh decision "work-queue-finalized" \
  "[n] items to implement, [k] killed, [l] lanes"
```

## Optional: Reducer Agent

For complex objectives (L/XL) with many findings, spawn a merge agent:

> subagent: feature-dev:code-architect
>
> You are the **reducer**.
> SESSION: $SESSION_ID
>
> You have findings from [n] MAP agents and reflection output.
> Merge into one canonical work queue:
> 1. Deduplicate (same file:line = one item)
> 2. Resolve contradictions (evidence wins)
> 3. Create kill list (out of scope, false positive, low ROI, blocked, premature)
> 4. Prioritize: severity → confidence → effort → dependencies
> 5. Assign file ownership (one agent per file)
> 6. Build dependency graph and group into parallel lanes
>
> Output: Ordered work queue + kill list + ownership map + lane structure.

## Output Schema

```json
{
  "gate": 6,
  "work_items": 0,
  "killed_items": 0,
  "lanes": 0,
  "estimated_agents": 0,
  "ownership_map": {},
  "verification_plan": []
}
```

## Exit Condition

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 6 "reduce-complete" \
  "work_items=[n]" \
  "killed=[n]" \
  "lanes=[n]" \
  "estimated_agents=[n]"
```

**PROCEED** if work queue exists with clear ownership and no unresolved conflicts.
**HALT** if contradictions unresolvable → escalate to user with evidence from both sides.
