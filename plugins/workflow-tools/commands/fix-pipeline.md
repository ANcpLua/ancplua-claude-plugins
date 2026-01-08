---
description: "Systematic fix pipeline - takes audit findings through deep analysis, planning, implementation, and verification. Usage: /fix-pipeline [issue] [severity:P1] [context:.]"
allowed-tools: Task, Bash, TodoWrite
---

# Fix Pipeline

**Issue:** $1
**Severity:** $2 (default: P1)
**Context:** $3 (default: .)

---

<CRITICAL_EXECUTION_REQUIREMENT>
**YOU MUST RUN ALL PHASES WITHOUT STOPPING.**

CRITICAL INSTRUCTIONS:
1. Execute ALL phases (1→2→3→4) in sequence WITHOUT pausing for user input
2. DO NOT ask "should I continue?" - just continue
3. DO NOT wait for confirmation between phases
4. Use TodoWrite to track progress, mark items complete AS YOU GO
5. Only stop if: build fails, tests fail, or you encounter an unrecoverable error
6. At the end, provide a SINGLE summary of everything done

FORBIDDEN:
- Stopping to ask "proceed?"
- Waiting for user acknowledgment
- Pausing between phases
- Asking clarifying questions (make reasonable assumptions)

**YOUR NEXT MESSAGE: Launch 3 Task tool calls for Phase 1. NOTHING ELSE.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## Phase 1: Deep Analysis (3 Parallel Agents)

Launch ALL THREE agents in parallel using a single message with multiple Task tool calls:

### Agent 1: Root Cause Analysis
```yaml
subagent_type: deep-debugger
model: opus
prompt: |
  ISSUE: [insert $1 here]
  SEVERITY: [insert $2 here, default P1]
  CONTEXT: [insert $3 here, default .]

  MISSION: Find the root cause, not just symptoms.

  INVESTIGATE:
  1. What is the exact failure mode?
  2. What are ALL possible causes?
  3. What evidence confirms/denies each?
  4. What's the minimal reproduction?

  DO NOT PROPOSE FIXES YET.

  Output: Root cause analysis with confidence levels
```

### Agent 2: Impact Assessment
```yaml
subagent_type: metacognitive-guard:arch-reviewer
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  ASSESS IMPACT:
  1. What depends on the broken code?
  2. What will break if we change it?
  3. Is this local or systemic?
  4. What invariants are at risk?

  Output: Impact map with risk levels
```

### Agent 3: Codebase Context
```yaml
subagent_type: feature-dev:code-explorer
prompt: |
  ISSUE: [insert $1 here]
  CONTEXT: [insert $3 here, default .]

  GATHER CONTEXT:
  1. Find all relevant code paths
  2. How is this pattern used elsewhere?
  3. What tests cover this area?
  4. Any recent changes to this code?

  Output: Relevant code locations and patterns
```

**→ IMMEDIATELY proceed to Phase 2 after agents complete. DO NOT STOP.**

---

## Phase 2: Solution Design (2 Parallel Agents)

Launch BOTH agents in parallel:

### Agent 4: Solution Architect
```yaml
subagent_type: feature-dev:code-architect
model: opus
prompt: |
  Given Phase 1 analysis, design solutions.

  FOR EACH SOLUTION:
  1. What it fixes
  2. Code changes required
  3. Risk of regression
  4. Implementation complexity (1-10)
  5. Confidence (%)

  RANK by: confidence × impact / complexity

  Output: Top 3 solutions with implementation plans
```

### Agent 5: Devil's Advocate
```yaml
subagent_type: feature-dev:code-reviewer
prompt: |
  CHALLENGE each proposed solution:

  1. What could go wrong?
  2. What assumptions are we making?
  3. Edge cases that break this?
  4. Better alternatives we're missing?

  Output: Risk analysis and counterarguments
```

**→ Select the highest-ranked solution and IMMEDIATELY proceed to Phase 3. DO NOT STOP.**

---

## Phase 3: Implementation

**Execute the top-ranked solution directly. No user approval needed.**

### Implementation Agent
```yaml
subagent_type: feature-dev:code-architect
prompt: |
  IMPLEMENT the approved solution.

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
  - [ ] Code reviewed

  Output: Files changed + verification results
```

**→ IMMEDIATELY proceed to Phase 4 after implementation. DO NOT STOP.**

---

## Phase 4: Verification

Run these commands and report results:

```bash
# Build
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1

# Test
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
```

---

## Final Summary

After Phase 4, provide a SINGLE consolidated summary:

| Phase | Status | Key Findings |
|-------|--------|--------------|
| 1. Analysis | ✅/❌ | [Root cause] |
| 2. Design | ✅/❌ | [Chosen solution] |
| 3. Implementation | ✅/❌ | [Files changed] |
| 4. Verification | ✅/❌ | [Build/Test/Lint results] |

**Issue Status:** FIXED / PARTIALLY FIXED / BLOCKED
**Next Steps:** [If any]
