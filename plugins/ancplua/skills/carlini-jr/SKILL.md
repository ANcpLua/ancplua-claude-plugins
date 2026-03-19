---
name: carlini-jr
description: >-
  Leaderless multi-agent swarm with Playwright oracle. Spawns N workers in
  isolated worktrees with pre-partitioned DOD items. Workers implement and
  verify via screenshots. No orchestrator, no shared state.
allowed-tools: Agent, Bash, Read, Glob, Grep, TodoWrite
effort: high
---

# carlini-jr

Leaderless swarm launcher. Workers implement and verify via Playwright MCP screenshots.

## Coordination Model

Workers run in isolated git worktrees. There is **no shared filesystem** — no lock files,
no coordination directories, no status files. Coordination is structural:

1. The lead **partitions DOD items** across workers before spawning
2. Each worker's **prompt contains** their assigned items plus the full DOD
3. Workers are **autonomous after spawn** — the lead does not monitor or intervene
4. The **Agent tool blocks** until all workers return — that is the aggregation

This diverges from Carlini's git-push-racing locks because his agents ran for days across
2000 sessions. Ours run for minutes as subagents. Pre-partitioning is simpler and correct.

## Workflow

### Step 1 — Parse Seed

Extract DOD items from the user's prompt. Each item must be an **observable outcome**
verifiable by screenshot (not a code quality requirement).

Example prompt: "build the dashboard with sidebar navigation and 3 data charts"

DOD items:

1. Sidebar navigation visible on left side of page
2. Chart 1 rendered with data
3. Chart 2 rendered with data
4. Chart 3 rendered with data

### Step 2 — Auto-Scale

Calculate agent count: `agents = min(max(2, ceil(dod_items / 2)), 8)`

User can override by saying "use 6 agents" in the prompt.

| DOD Items | Agents |
|-----------|--------|
| 1-3       | 2      |
| 4-5       | 2-3    |
| 6-7       | 3-4    |
| 8+        | 4-8    |

### Step 3 — Partition DOD

Distribute items across workers using round-robin:

- 4 items, 2 workers: Worker 1 gets [1, 3], Worker 2 gets [2, 4]
- 6 items, 3 workers: Worker 1 gets [1, 4], Worker 2 gets [2, 5], Worker 3 gets [3, 6]

Each worker also receives the **full DOD** for context. If a worker finishes their
primary items early, they may attempt overflow items not in their assignment.
Duplicate work across worktrees is harmless — the lead takes the passing version.

### Step 4 — Spawn Workers

Spawn ALL workers in a **single message** using the Agent tool.
Every worker gets `isolation: "worktree"`.

Each worker spawn prompt must include:

1. **Primary assignment**: "You are Worker K of M. Your items: [list]"
2. **Full DOD**: all items for context and overflow
3. **Project context**: what app, what framework, where to find things
4. **Playwright requirement**: verify every item via screenshot

```text
For each worker, use:
  Agent tool:
    isolation: "worktree"
    prompt: |
      You are Worker {K} of {M} in a carlini-jr swarm.

      ## Your Primary Items
      {assigned items for this worker}

      ## Full DOD (for context and overflow)
      {all DOD items}

      ## Project Context
      {what app, framework, how to run it}

      ## Instructions
      {inline the worker agent instructions from worker.md}

      Implement your primary items first. Verify each via Playwright
      MCP screenshot. If you finish early, pick overflow items from
      the full DOD that are NOT in your primary assignment.
```

All workers launch in ONE message — maximum parallelism.

### Step 5 — Collect Results

The lead does NOT monitor workers. The Agent tool blocks until all workers return.

When all workers return, report:

- Which DOD items passed (with screenshot evidence from the worker)
- Which items failed (with last screenshot showing the failure)
- Which items were attempted by multiple workers (take the passing version)
- Any items that no worker attempted

If workers produced changes in their worktrees, the lead merges the passing
worktree branches. If two workers changed the same file, take the version
backed by a passing screenshot.

## Failure Conditions

- DO NOT create coordination directories, lock files, or status files
- DO NOT orchestrate after spawn. The lead spawns and waits. Workers self-direct.
- DO NOT evaluate code quality. Only Playwright screenshots matter.
- DO NOT retry more than 3 times per DOD item per worker.
- DO NOT use `subagent_type` for worker — inline the worker instructions in the prompt.

## Example Invocation

```text
/ancplua:carlini-jr build the dashboard with sidebar navigation and 3 data charts
```

That's it. Everything else is defaults.
