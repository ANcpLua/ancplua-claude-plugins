---
description: "Unified fix pipeline - configurable parallelism for issue resolution. Usage: /fix [issue] [severity:P1] [parallelism:standard] [mode:balanced] [quick:false]"
allowed-tools: Task, Bash, TodoWrite
---

# FIX PIPELINE

**Issue:** $1
**Severity:** $2 (default: P1, options: P0|P1|P2|P3)
**Parallelism:** $3 (default: standard, options: maximum|standard)
**Mode:** $4 (default: balanced, options: aggressive|balanced|conservative)
**Quick:** $5 (default: false - skip devil's advocate phases)

---

## PARALLELISM CONFIGURATIONS

| Parallelism | Agents | Phases | Best For |
|-------------|--------|--------|----------|
| **maximum** | 8 | 4→2→1→1 | P0/P1 critical bugs, complex issues |
| **standard** | 4 | 2→1→1→0 | P2/P3 bugs, focused changes |

## MODE CONFIGURATIONS

| Mode | Behavior |
|------|----------|
| **aggressive** | All solutions explored, maximum competition |
| **balanced** | Top solutions evaluated, devil's advocate review |
| **conservative** | Minimal change, high confidence required |

---

## EXECUTION INSTRUCTIONS

<CRITICAL_EXECUTION_REQUIREMENT>
**RUN ALL PHASES WITHOUT STOPPING.**

1. Execute ALL phases in sequence WITHOUT pausing for user input
2. DO NOT ask "should I continue?" - just continue
3. Use TodoWrite to track progress
4. Only stop if: build fails, tests fail, or unrecoverable error

**GATE CHECKPOINTS:** After each phase, validate success before proceeding.
</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: ANALYSIS SWARM

**Maximum parallelism (4 agents) - Use if $3 = maximum**
**Standard parallelism (2 agents) - Use if $3 = standard or not specified**

### GATE 1: Analysis Validation

Before proceeding to Phase 2, verify:
- ≥80% of analysis agents completed successfully
- At least ONE root cause identified with >60% confidence
- Impact assessment completed

```
GATE 1 CHECKPOINT:
┌────────────────────────────────────────────┐
│ Analysis Agents: [X/Y] completed           │
│ Root Cause Confidence: [X]%                │
│ Impact Assessment: [COMPLETE/INCOMPLETE]   │
├────────────────────────────────────────────┤
│ VERDICT: PROCEED / HALT                    │
└────────────────────────────────────────────┘
```

If HALT: Report findings and stop. Do not proceed with incomplete analysis.

---

### Standard Analysis (2 Agents)

Launch ALL 2 agents in ONE message:

#### Agent 1: Root Cause Analysis
```yaml
subagent_type: deep-debugger
model: opus
description: "Hunt root cause"
prompt: |
  ISSUE: [insert $1 here]
  SEVERITY: [insert $2 here, default P1]

  MISSION: Find the ROOT CAUSE.

  1. What is the exact failure mode?
  2. List ALL possible causes (5+)
  3. Evidence for/against each
  4. Confidence ranking (percentage)

  Output: Root cause with confidence level
```

#### Agent 2: Impact Assessment
```yaml
subagent_type: metacognitive-guard:arch-reviewer
model: opus
description: "Map system impact"
prompt: |
  ISSUE: [insert $1 here]

  ASSESS IMPACT:
  1. What depends on broken code?
  2. What will break if we change it?
  3. Is this local or systemic?
  4. What invariants are at risk?

  Output: Impact map with risk levels
```

---

### Maximum Analysis (4 Agents) - Only if $3 = maximum

Launch ALL 4 agents in ONE message:

#### Agent 1: Root Cause Hunter
```yaml
subagent_type: deep-debugger
model: opus
description: "Hunt root cause"
prompt: |
  ISSUE: [insert $1 here]

  MISSION: Find the ROOT CAUSE.

  1. What is the exact failure mode?
  2. List ALL possible causes (5+)
  3. Evidence for/against each
  4. Confidence ranking

  Output: Root cause with 90%+ confidence
```

#### Agent 2: System Architect
```yaml
subagent_type: metacognitive-guard:arch-reviewer
model: opus
description: "Map system impact"
prompt: |
  ISSUE: [insert $1 here]

  MISSION: Map system IMPACT.

  1. What depends on broken code?
  2. Ripple effects of changes?
  3. Invariants at risk?
  4. Is this local or systemic?

  Output: Impact map with risk levels
```

#### Agent 3: Code Explorer
```yaml
subagent_type: feature-dev:code-explorer
description: "Find relevant code"
prompt: |
  ISSUE: [insert $1 here]

  MISSION: Find ALL relevant code.

  1. All code paths involved
  2. Similar patterns elsewhere
  3. Test coverage for this area
  4. Recent changes to this code

  Output: File:line map of relevant code
```

#### Agent 4: History Detective
```yaml
subagent_type: Explore
description: "Find change history"
prompt: |
  ISSUE: [insert $1 here]

  MISSION: Find the HISTORY.

  1. When did this break? (git blame/log)
  2. What commit introduced it?
  3. Was this working before?
  4. Related issues/PRs?

  Output: Timeline of changes
```

**→ VALIDATE GATE 1, then proceed to Phase 2.**

---

## PHASE 2: SOLUTION DESIGN

**Maximum parallelism (2 agents): 1 architect + devil's advocate**
**Standard parallelism (1 agent): 1 architect only**
**Quick mode ($5 = true): Skip devil's advocate (standard becomes 1 agent)**

### GATE 2: Solution Validation

Before proceeding to Phase 3, verify:
- At least 2 viable solutions proposed (or 1 if quick mode)
- Solutions have implementation plans
- Risk assessment completed

```
GATE 2 CHECKPOINT:
┌────────────────────────────────────────────┐
│ Solutions Proposed: [X]                    │
│ Top Solution Confidence: [X]%              │
│ Risk Assessment: [COMPLETE/INCOMPLETE]     │
├────────────────────────────────────────────┤
│ VERDICT: PROCEED / HALT                    │
└────────────────────────────────────────────┘
```

---

### Standard Design (1 Agent)

#### Agent: Solution Architect
```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Design solutions"
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

---

### Maximum Design (2 Agents) - Only if $3 = maximum

#### Agent 7: Solution Architect A
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

#### Agent 8: Devil's Advocate (Skip if $5 = true)
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

**→ SELECT best solution, VALIDATE GATE 2, proceed to Phase 3.**

---

## PHASE 3: IMPLEMENTATION

**Maximum parallelism (1 agent): Single TDD implementer**
**Standard parallelism (1 agent): Single TDD implementer**

### GATE 3: Implementation Validation

Before proceeding to Phase 4, verify:
- Implementation compiles
- Tests exist (failing initially, then passing)
- No obvious regressions introduced

```
GATE 3 CHECKPOINT:
┌────────────────────────────────────────────┐
│ Implementation: [COMPLETE/INCOMPLETE]      │
│ Tests Written: [YES/NO]                    │
│ Compiles: [YES/NO]                         │
├────────────────────────────────────────────┤
│ VERDICT: PROCEED / HALT                    │
└────────────────────────────────────────────┘
```

---

### Standard Implementation (1 Agent)

#### Implementation Agent
```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Implement fix with TDD"
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

  Output: Files changed + verification results
```

**→ VALIDATE GATE 3, proceed to Phase 4.**

---

## PHASE 4: VERIFICATION

Run verification commands:

```bash
# Build
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1

# Test
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
```

### FINAL GATE: Verification Results

```
FINAL GATE:
┌────────────────────────────────────────────┐
│ Build: [PASS/FAIL]                         │
│ Tests: [PASS/FAIL]                         │
│ Lint: [PASS/FAIL]                          │
├────────────────────────────────────────────┤
│ VERDICT: FIXED / BLOCKED                   │
└────────────────────────────────────────────┘
```

---

## FIX SUMMARY

After ALL phases complete:

```
╔══════════════════════════════════════════════════════════════╗
║                      FIX COMPLETE                            ║
╠══════════════════════════════════════════════════════════════╣
║ Issue: $1                                                    ║
║ Severity: $2 │ Parallelism: $3 │ Mode: $4                    ║
╠══════════════════════════════════════════════════════════════╣
║ Phase 1: Analysis    │ [X/Y] agents │ Root cause: [X]        ║
║ Phase 2: Solutions   │ [X/Y] agents │ Selected: [name]       ║
║ Phase 3: Implement   │ [X/Y] agents │ Files: [count]         ║
║ Phase 4: Verify      │ Build/Test/Lint: ✅/❌                 ║
╠══════════════════════════════════════════════════════════════╣
║ TOTAL AGENTS: [X]    TIME: [X min]                           ║
║ STATUS: FIXED / BLOCKED                                      ║
╚══════════════════════════════════════════════════════════════╝
```

| Phase | Gate Status | Findings |
|-------|-------------|----------|
| 1. Analysis | PASS/FAIL | [Summary] |
| 2. Design | PASS/FAIL | [Chosen solution] |
| 3. Implementation | PASS/FAIL | [Files changed] |
| 4. Verification | PASS/FAIL | [Results] |

**Issue Status:** FIXED / PARTIALLY FIXED / BLOCKED
**Next Steps:** [If any]
