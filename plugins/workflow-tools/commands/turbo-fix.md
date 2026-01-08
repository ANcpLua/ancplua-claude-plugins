---
description: "Maximum parallelism fix pipeline - 16 agents across 4 phases for fastest resolution. Usage: /turbo-fix [issue] [severity:P0] [context:.]"
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
- Phase 1: Launch 6 Task tools in ONE message
- Phase 2: Launch 4 Task tools in ONE message
- Phase 3: Launch 3 Task tools in ONE message
- Phase 4: Run verification commands

EACH TASK MUST USE:
- subagent_type: (from the yaml blocks below)
- prompt: (the full prompt text with user's issue/context inserted)
- description: (short 3-5 word summary)

**YOUR NEXT MESSAGE MUST CONTAIN 6 Task TOOL CALLS FOR PHASE 1.**

---

## Phase 1: SWARM ANALYSIS (6 Agents Parallel)

Launch ALL 6 agents in ONE message. Insert the user's issue ($1) and context ($3) into each prompt.

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

### Agent 5: Pattern Matcher
```yaml
subagent_type: feature-dev:code-explorer
description: "Find similar bugs"
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  MISSION: Find SIMILAR bugs.

  1. Same pattern elsewhere in codebase?
  2. Similar bugs fixed before?
  3. Common anti-patterns?
  4. Systemic issues?

  Output: Similar code locations that might have same bug
```

### Agent 6: Test Analyzer
```yaml
subagent_type: feature-dev:code-reviewer
description: "Analyze test gaps"
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  MISSION: Analyze TEST coverage.

  1. What tests exist for this area?
  2. Why didn't tests catch this?
  3. What tests are missing?
  4. Test quality issues?

  Output: Test gap analysis
```

**-> WAIT for all 6 agents, then IMMEDIATELY proceed to Phase 2.**

---

## Phase 2: SOLUTION SWARM (4 Agents Parallel)

Launch ALL 4 agents in ONE message:

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

### Agent 8: Solution Architect B
```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Design robust solution"
prompt: |
  Given Phase 1 analysis, design Solution B.

  Focus: ROBUST LONG-TERM approach

  1. Fix + prevent future issues
  2. Refactoring if needed
  3. Better abstractions
  4. Implementation steps

  Output: Solution B with implementation plan
```

### Agent 9: Solution Architect C
```yaml
subagent_type: dotnet-mtp-advisor
model: opus
description: "Design alternative solution"
prompt: |
  Given Phase 1 analysis, design Solution C.

  Focus: ALTERNATIVE APPROACH

  1. Different paradigm/pattern
  2. What if we redesign this part?
  3. Unconventional solutions
  4. Trade-offs

  Output: Solution C with implementation plan
```

### Agent 10: Devil's Advocate
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

**-> WAIT for all 4 agents, then SELECT best solution and proceed to Phase 3.**

---

## Phase 3: IMPLEMENTATION SWARM (3 Agents Parallel)

Launch ALL 3 agents in ONE message:

### Agent 11: Test Writer
```yaml
subagent_type: feature-dev:code-architect
description: "Write tests first"
prompt: |
  WRITE TESTS FIRST.

  Based on selected solution:
  1. Write failing unit test
  2. Write edge case tests
  3. Write regression test

  DO NOT implement the fix yet.

  Output: Test files with paths
```

### Agent 12: Implementation Coder
```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Implement the fix"
prompt: |
  IMPLEMENT the selected solution.

  1. Make the minimal code change
  2. Follow existing patterns
  3. No unnecessary refactoring
  4. Add comments only if complex

  Output: Changed files with diffs
```

### Agent 13: Documentation Updater
```yaml
subagent_type: Explore
description: "Check docs needed"
prompt: |
  CHECK what docs need updating:

  1. README changes needed?
  2. API docs affected?
  3. CHANGELOG entry?
  4. Comments in code?

  Output: Documentation updates needed
```

**-> WAIT for all 3 agents, then proceed to Phase 4.**

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

```
╔══════════════════════════════════════════════════════════════╗
║                    TURBO FIX COMPLETE                        ║
╠══════════════════════════════════════════════════════════════╣
║ Phase 1: Analysis    │ 6/6 agents │ Root cause: [X]          ║
║ Phase 2: Solutions   │ 4/4 agents │ Selected: [A/B/C]        ║
║ Phase 3: Implement   │ 3/3 agents │ Files: [count]           ║
║ Phase 4: Verify      │ 3/3 tasks  │ Build/Test/Lint: ✅/❌    ║
╠══════════════════════════════════════════════════════════════╣
║ TOTAL AGENTS: 16          TIME: [X min]                      ║
║ STATUS: FIXED / BLOCKED                                      ║
╚══════════════════════════════════════════════════════════════╝
```

| Phase | Agents | Findings |
|-------|--------|----------|
| 1. Analysis | 6 | [Summary] |
| 2. Design | 4 | [Chosen solution] |
| 3. Implementation | 3 | [Files changed] |
| 4. Verification | 3 | [Results] |

**Issue:** $1
**Status:** FIXED / PARTIALLY FIXED / BLOCKED
**Next Steps:** [If any]
