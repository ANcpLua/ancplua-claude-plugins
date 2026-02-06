---
description: "Maximum parallelism fix pipeline - 8 agents across 4 phases for fastest resolution. Usage: /turbo-fix [issue] [severity:P0] [context:.]"
allowed-tools: Task, Bash, TodoWrite
---

# TURBO FIX

**Issue:** $1
**Severity:** $2 (default: P0)
**Context:** $3 (default: .)

---

## EXECUTION INSTRUCTIONS

**YOU MUST USE THE TASK TOOL TO LAUNCH AGENTS. YOU ORCHESTRATE, AGENTS FIX.**

REQUIRED BEHAVIOR:

- Phase 1: Launch 4 Task tools in ONE message
- Phase 2: Launch 2 Task tools in ONE message
- Phase 3: Launch 1 Task tool
- Phase 4: Run verification commands

EACH TASK MUST USE:

- subagent_type: (from the yaml blocks below)
- prompt: (the full prompt text with user's issue/context inserted)
- description: (short 3-5 word summary)

**YOUR NEXT MESSAGE MUST CONTAIN 4 Task TOOL CALLS FOR PHASE 1.**

---

## Phase 1: SWARM ANALYSIS (4 Agents Parallel)

Launch ALL 4 agents in ONE message. Insert the user's issue ($1) and context ($3) into each prompt.

### Agent 1: Root Cause Hunter

```yaml
subagent_type: deep-debugger
model: opus
description: "Hunt root cause"
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  MISSION: Find the ROOT CAUSE.

  1. What is the exact failure mode?
  2. List ALL possible causes (5+)
  3. Evidence for/against each
  4. Confidence ranking

  Output: Root cause with 90%+ confidence
```

### Agent 2: System Architect

```yaml
subagent_type: metacognitive-guard:arch-reviewer
model: opus
description: "Map system impact"
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  MISSION: Map system IMPACT.

  1. What depends on broken code?
  2. Ripple effects of changes?
  3. Invariants at risk?
  4. Is this local or systemic?

  Output: Impact map with risk levels
```

### Agent 3: Code Explorer

```yaml
subagent_type: feature-dev:code-explorer
description: "Find relevant code"
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  MISSION: Find ALL relevant code.

  1. All code paths involved
  2. Similar patterns elsewhere
  3. Test coverage for this area
  4. Recent changes to this code

  Output: File:line map of relevant code
```

### Agent 4: History Detective

```yaml
subagent_type: Explore
description: "Find change history"
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  MISSION: Find the HISTORY.

  1. When did this break? (git blame/log)
  2. What commit introduced it?
  3. Was this working before?
  4. Related issues/PRs?

  Output: Timeline of changes
```

**-> WAIT for all 4 agents, then IMMEDIATELY proceed to Phase 2.**

---

## Phase 2: SOLUTION SWARM (2 Agents Parallel)

Launch ALL 2 agents in ONE message:

### Agent 7: Solution Architect A

```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Design minimal solution"
prompt: |
  Given Phase 1 analysis, design Solution A.

  Focus: MINIMAL CHANGE approach

  1. Smallest possible fix
  2. Code changes required
  3. Risk assessment
  4. Implementation steps

  Output: Solution A with implementation plan
```

### Agent 8: Devil's Advocate

```yaml
subagent_type: feature-dev:code-reviewer
description: "Attack all solutions"
prompt: |
  ATTACK all proposed solutions:

  For EACH solution:
  1. What will break?
  2. Hidden assumptions?
  3. Edge cases that fail?
  4. Why is this wrong?

  Be HARSH. Find problems.

  Output: Risk analysis per solution
```

**-> WAIT for all 2 agents, then SELECT best solution and proceed to Phase 3.**

---

## Phase 3: IMPLEMENTATION (1 Agent)

Launch the implementation agent:

### Agent 9: Implementation with TDD

```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Implement the fix"
prompt: |
  IMPLEMENT the selected solution using TDD.

  FOLLOW TDD:
  1. Write failing test first
  2. Implement minimal fix
  3. Verify test passes
  4. Refactor if needed

  CHECKLIST:
  - [ ] Test written and failing
  - [ ] Fix implemented
  - [ ] Test passing
  - [ ] No regressions

  Output: Changed files with verification results
```

**-> WAIT for implementation to complete, then proceed to Phase 4.**

---

## Phase 4: VERIFICATION

Run verification commands:

```bash
# Build
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1

# Test
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
```

---

## TURBO SUMMARY

After ALL phases complete, provide this summary:

```text
╔══════════════════════════════════════════════════════════════╗
║                    TURBO FIX COMPLETE                        ║
╠══════════════════════════════════════════════════════════════╣
║ Phase 1: Analysis    │ 4/4 agents │ Root cause: [X]          ║
║ Phase 2: Solutions   │ 2/2 agents │ Selected: [A]            ║
║ Phase 3: Implement   │ 1/1 agent  │ Files: [count]           ║
║ Phase 4: Verify      │ 3/3 tasks  │ Build/Test/Lint: ✅/❌    ║
╠══════════════════════════════════════════════════════════════╣
║ TOTAL AGENTS: 8           TIME: [X min]                      ║
║ STATUS: FIXED / BLOCKED                                      ║
╚══════════════════════════════════════════════════════════════╝
```

| Phase | Agents | Findings |
|-------|--------|----------|
| 1. Analysis | 4 | [Summary] |
| 2. Design | 2 | [Chosen solution] |
| 3. Implementation | 1 | [Files changed] |
| 4. Verification | 3 | [Results] |

**Issue:** $1
**Status:** FIXED / PARTIALLY FIXED / BLOCKED
**Next Steps:** [If any]
