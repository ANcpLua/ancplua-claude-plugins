---
description: Launch Carlini-style agent team for qyl development (8 agents, parallel, autonomous)
argument-hint: [goal] [--agents N] [--dry-run]
---

# /calini [goal]

Launch 8 autonomous agents to work on the qyl AI observability platform in parallel.
Based on Nicholas Carlini's approach (Anthropic research, March 2026) that used 16
agents to build a C compiler.

## How It Works

1. Captain reads PROGRESS.md and CHANGELOG.md to understand current state
2. Decomposes the goal into independent tasks with file ownership boundaries
3. Spawns 8 agents (3 general + 5 specialist) via Teams API
4. Agents self-coordinate via git — lock tasks, do work, push, unlock
5. Captain monitors for stuck agents (>30 min on same task) and rebalances
6. When all tasks complete or goal is met, captain synthesizes results

## Agent Composition

```
3x general         — pick highest-impact unlocked work
1x collector       — ASP.NET Core, OTLP, DuckDB storage
1x dashboard       — React 19, Base UI, Tailwind CSS 4
1x generators      — Roslyn source generators, OTel semconv
1x test-engineer   — xUnit v3, Playwright E2E, MTP
```

That's 7 workers + you (the captain) = 8 total.

## Phase 1: Assess (you do this)

Before spawning anyone:

1. Read `/Users/ancplua/qyl/CHANGELOG.md` — current state, unreleased work
2. Read `/Users/ancplua/qyl/PROGRESS.md` if it exists — priorities, dead ends
3. Read `current_tasks/` if it exists — any stale locks
4. Understand the goal the user gave you

If no goal was provided, read CHANGELOG.md and identify the highest-impact work.

## Phase 2: Decompose

Break the goal into 7+ independent tasks. Each task must have:

- **Clear scope** — what "done" looks like
- **File ownership** — which directories this task touches
- **Agent assignment** — which specialist (or general) should take it
- **Test criteria** — how to verify it works

Write the task list to PROGRESS.md:

```markdown
## Current Sprint: [goal]

### Tasks
- [ ] [collector] Implement X in src/qyl.collector/...
- [ ] [dashboard] Build Y component in src/qyl.dashboard/...
- [ ] [generators] Add Z interceptor pipeline in src/qyl.instrumentation.generators/...
- [ ] [test-engineer] Write tests for X, Y, Z
- [ ] [general-1] Update contracts for new schema
- [ ] [general-2] Wire up MCP tool for new feature
- [ ] [general-3] Update CHANGELOG.md with all changes

### File Ownership
collector:     src/qyl.collector/**
dashboard:     src/qyl.dashboard/**
generators:    src/qyl.instrumentation.generators/**, src/qyl.collector.storage.generators/**
test-engineer: tests/**
general-1:     src/qyl.contracts/**, core/**
general-2:     src/qyl.mcp/**
general-3:     CHANGELOG.md, docs/**
```

## Phase 3: Spawn (all in ONE message)

Create the team, then spawn all 7 agents in a single message:

```
TeamCreate(team_name="calini")
```

Then spawn all agents in ONE message (critical for parallelism):

Each agent gets this context in their prompt:

1. The qyl project lives at `/Users/ancplua/qyl/`
2. Their assigned task(s) from Phase 2
3. Their file ownership boundaries
4. The task locking protocol (below)
5. Key qyl conventions (below)

## Task Locking Protocol

Every agent must follow this before starting work:

```bash
# Claim task
TASK="descriptive_name"
echo "Agent: [name] | Started: $(date -u) | Task: $TASK" > current_tasks/${TASK}.lock
git add current_tasks/${TASK}.lock
git commit -m "lock: $TASK [agent-name]"
git pull --rebase origin main && git push origin main
# If push fails: another agent claimed it. Pick different task.

# When done
git rm current_tasks/${TASK}.lock
git add -A
git commit -m "done: $TASK [agent-name]"
git pull --rebase origin main && git push origin main
```

## qyl Conventions (include in every agent prompt)

Every agent MUST know these:

```
PROJECT: /Users/ancplua/qyl/
RUNTIME: .NET 10.0 LTS, C# 14, net10.0
FRONTEND: React 19, Vite 7, Tailwind CSS 4, Base UI (NEVER Radix UI)
DATABASE: DuckDB 1.5.0 (columnar, upsert ON CONFLICT)
TELEMETRY: OTel 1.15.0, GenAI Semantic Conventions 1.40
TESTING: xUnit v3 + Microsoft Testing Platform (MTP)
BUILD: nuke Full (TypeSpec -> Docker)

BANNED:
- DateTime.Now/UtcNow -> use TimeProvider.System.GetUtcNow()
- object _lock -> use Lock _lock = new()
- Newtonsoft.Json -> use System.Text.Json
- ISourceGenerator -> use IIncrementalGenerator
- SyntaxFactory -> use raw strings
- Runtime reflection -> use source generators
- Radix UI / asChild / Slot -> use Base UI primitives
- No #pragma warning disable, no [SuppressMessage]

COORDINATION:
- CHANGELOG.md is the source of truth for all work
- Update CHANGELOG.md before committing (Added/Changed/Fixed/Removed)
- Check CHANGELOG.md before starting (avoid duplicating work)
```

## Phase 4: Monitor

While agents work, periodically:

1. Check `current_tasks/` for stale locks (>30 min without commits from that agent)
2. Read agent messages via the Teams API
3. If an agent is stuck, send guidance via SendMessage
4. If a task is blocked, reassign it

## Phase 5: Integrate

When agents finish:

1. Pull all changes
2. Run `nuke Full` to verify the build
3. Run `dotnet test` to verify all tests pass
4. Check CHANGELOG.md is complete
5. Report results to the user

## Scaling

The user can adjust agent count:

- `--agents 4` — 2 general + collector + dashboard (quick fixes)
- `--agents 8` — default (full sprint)
- `--agents 12` — add 4 more generals (big feature push)

## Dry Run

`/calini --dry-run [goal]` — decompose and show the task list without spawning agents.
Useful for reviewing the plan before burning tokens.

## Anti-Patterns

- Do NOT use an orchestrator agent that micromanages — agents self-direct
- Do NOT let two agents edit the same file — enforce ownership
- Do NOT skip the lock protocol — merge conflicts waste everyone's time
- Do NOT let agents cat entire files into context — grep/head/tail only
- Do NOT run all tests on every iteration — use `--fast` (10% sample)
