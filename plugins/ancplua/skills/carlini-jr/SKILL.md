---
name: carlini-jr
description: Leaderless multi-agent swarm with Playwright oracle. Spawns N workers that self-select from DOD items, implement, and verify via screenshots. No orchestrator.
allowed-tools: Agent, Bash, Read, Glob, Grep, TodoWrite
---

# carlini-jr

Leaderless swarm launcher. Workers self-select tasks, implement, and verify via Playwright MCP screenshots.

## Workflow

### Step 1 — Parse Seed

Extract DOD items from the user's prompt. Each item must be an **observable outcome** verifiable
by screenshot (not a code quality requirement).

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
| 1-3 | 2 |
| 4-5 | 2-3 |
| 6-7 | 3-4 |
| 8+ | 4-8 |

### Step 3 — Create Coordination Substrate

```bash
mkdir -p .carlini-jr/current_tasks/ .carlini-jr/dod/
```

This directory is the entire coordination mechanism. No databases, no message queues, no APIs.

Add `.carlini-jr/` to `.gitignore` if not already present.

### Step 4 — Write DOD File

Write `.carlini-jr/dod.md` as a **read-only reference** — item definitions only, no mutable status
table. Workers never modify this file; they write their own results to per-worker files.

```markdown
# Definition of Done

## Items

- [ ] 1. Sidebar navigation visible on left side of page
- [ ] 2. Chart 1 rendered with data
- [ ] 3. Chart 2 rendered with data
- [ ] 4. Chart 3 rendered with data
```

Workers write outcomes to `.carlini-jr/dod/<worker-id>.md` (one file per worker, using `>>`
redirection to append new item entries at the end). This removes contention: no two workers ever
write the same file, so no locking or merging is needed for status updates. The launcher
aggregates results at Step 6 by reading all per-worker files.

### Step 5 — Spawn Workers

Spawn ALL workers in a **single message** using the Agent tool. Every worker gets `isolation: "worktree"`.

Each worker spawn prompt must include:

1. The full DOD (copy the content, don't reference the file — worktrees are isolated copies)
2. The project context (what app, what framework, where to find things)
3. The Playwright oracle requirement
4. The worker agent definition from `${CLAUDE_PLUGIN_ROOT}/agents/worker.md`

```text
For each worker, use:
  Agent tool:
    subagent_type: worker (from this plugin's agents)
    isolation: "worktree"
    prompt: [full context + DOD + worker instructions]
```

All workers launch in ONE message — maximum parallelism.

### Step 6 — Exit

The lead does NOT monitor workers. Workers are autonomous.

When all workers return, aggregate results by reading all `.carlini-jr/dod/*.md` files, then
report:

- Which DOD items passed (with screenshot evidence)
- Which items failed (with last screenshot showing the failure)
- Any items that were never claimed (no entry in any per-worker file)

## Failure Conditions

- DO NOT orchestrate. The lead spawns and exits. Workers self-direct.
- DO NOT use SendMessage. File locks are the coordination mechanism.
- DO NOT evaluate code quality. Only Playwright screenshots matter.
- DO NOT retry more than 3 times per DOD item per worker.

## Example Invocation

```text
/ancplua:carlini-jr build the dashboard with sidebar navigation and 3 data charts
```

That's it. Everything else is defaults.
