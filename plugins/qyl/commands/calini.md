---
description: Launch Carlini-style agent team for qyl development (8 agents, parallel, autonomous)
argument-hint: "[goal] [--agents N]"
effort: high
---

# /qyl:calini [goal]

Launch 8 autonomous agents to work on the qyl AI observability platform in parallel.

## Phase 1: Assess (you do this)

1. Read `CHANGELOG.md` — current state, unreleased work
2. Read `PROGRESS.md` if it exists — priorities, dead ends
3. Understand the goal. If none given, identify highest-impact work from CHANGELOG.

## Phase 2: Decompose

Break goal into 7+ independent tasks. Each needs:
- Clear scope (what "done" looks like)
- File ownership (which directories)
- Agent assignment (which specialist)
- Test criteria

## Phase 3: Spawn (all in ONE message)

```
TeamCreate(team_name="calini")
```

Then spawn all 7 workers in a single message:

**Composition:**
- 3x `qyl:general` — highest-impact unlocked work
- 1x `qyl:collector` — src/qyl.collector/
- 1x `qyl:dashboard` — src/qyl.dashboard/
- 1x `qyl:generators` — src/qyl.instrumentation.generators/, src/qyl.collector.storage.generators/
- 1x `qyl:test-engineer` — tests/

That's 7 workers + you (captain) = 8.

**File ownership (agents use `isolation: worktree` — no file conflicts):**

```text
collector:     src/qyl.collector/**
dashboard:     src/qyl.dashboard/**
generators:    src/qyl.instrumentation.generators/**, src/qyl.collector.storage.generators/**
test-engineer: tests/**
general:       src/qyl.contracts/, src/qyl.instrumentation/, src/qyl.loom/, src/qyl.mcp/, core/, eng/, docs/
```

**Conventions (embed in every agent prompt):**

```text
RUNTIME: .NET 10.0 LTS, C# 14, net10.0
FRONTEND: React 19, Vite 7, Tailwind CSS 4, Base UI 1.3.0 (NEVER Radix/shadcn), lucide-react
DATABASE: DuckDB 1.5.0 (columnar, glibc, upsert ON CONFLICT)
OTEL: SDK 1.15.0, Semconv 1.40
MAF: AddAIAgent() hosted, AsAIAgent() standalone, MapAGUI(), AgentWorkflowBuilder
TESTING: xUnit v3 + MTP (NOT VSTest)
BUILD: nuke Full (TypeSpec -> Docker)

BANNED: DateTime.Now, Newtonsoft.Json, object _lock, ISourceGenerator, SyntaxFactory,
        #pragma warning disable, Radix UI, Phosphor, .Result/.Wait()
```

## Phase 4: Monitor

- Track via SendMessage — agents claim tasks by messaging captain
- Watch for stuck agents (>30 min same task) and rebalance
- When all tasks done, synthesize results and update CHANGELOG.md
