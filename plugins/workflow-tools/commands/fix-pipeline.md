---
name: fix-pipeline
description: Systematic fix pipeline - takes audit findings through deep analysis, planning, implementation, and verification
arguments:
  - name: issue
    description: "Issue description or ID from audit"
    required: true
  - name: severity
    description: "Severity level: P0|P1|P2|P3"
    default: "P1"
  - name: context
    description: "Relevant directory or files"
    default: "."
---

# Fix Pipeline

**Issue:** {{ issue }}
**Severity:** {{ severity }}
**Context:** {{ context }}

## Phase 1: Deep Analysis (Parallel Agents)

### Agent 1: Root Cause Analysis
```yaml
subagent_type: deep-debugger
model: opus
prompt: |
  ISSUE: {{ issue }}
  SEVERITY: {{ severity }}
  CONTEXT: {{ context }}

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
subagent_type: framework-migration:architect-review
prompt: |
  ISSUE: {{ issue }}
  CONTEXT: {{ context }}

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
  ISSUE: {{ issue }}
  CONTEXT: {{ context }}

  GATHER CONTEXT:
  1. Find all relevant code paths
  2. How is this pattern used elsewhere?
  3. What tests cover this area?
  4. Any recent changes to this code?

  Output: Relevant code locations and patterns
```

---

## Phase 2: Solution Design

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

---

## Phase 3: Implementation

Based on approved solution:

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

---

## Phase 4: Verification

```bash
# Build
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1

# Test
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1

# Lint
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
```

---

## Decision Point

After Phase 2, present to user:

**Recommended Solution:** [Top ranked]
**Confidence:** [X%]
**Risk:** [Low/Medium/High]

Proceed with implementation? [Y/n]
