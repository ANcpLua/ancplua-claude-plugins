---
description: "IF fixing audit findings THEN use this. 7 agents, 4 gated phases: analyze->design->implement->verify. For ad-hoc bugs -> fix. For P0 -> turbo-fix."
allowed-tools: Task, Bash, TodoWrite
---

# FIX PIPELINE — Systematic Resolution from Audit Findings

> Audit found it. Pipeline fixes it. Every phase gated.

**Issue:** $0
**Severity:** $1 (default: P1)
**Context:** $2 (default: .)

---

## TEAM ARCHITECTURE

```text
PIPELINE LEAD (You — Orchestrator)
│
├─ Phase 1: DEEP ANALYSIS (3 agents parallel)
│  ├── root-cause-analyst
│  ├── impact-assessor
│  └── context-gatherer
│  └── GATE 1 → PROCEED | HALT
│
├─ Phase 2: SOLUTION DESIGN (2 agents parallel)
│  ├── solution-architect
│  └── devils-advocate
│  └── GATE 2 → PROCEED | HALT
│
├─ Phase 3: IMPLEMENTATION (1 agent)
│  └── tdd-implementer
│  └── GATE 3 → PROCEED | HALT
│
└─ Phase 4: VERIFICATION (direct)
   └── Build + Test + Lint → FIXED | BLOCKED
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**RUN ALL 4 PHASES WITHOUT STOPPING.**

1. Launch 3 Phase 1 agents in ONE message
2. GATE 1, launch 2 Phase 2 agents
3. Select best, GATE 2, launch Phase 3 implementer
4. GATE 3, run verification directly

**DO NOT** ask "should I continue?" — make reasonable assumptions.
**YOUR NEXT MESSAGE: 3 Task tool calls for Phase 1. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: DEEP ANALYSIS — 3 Agents

Launch ALL 3 in ONE message.

### root-cause-analyst

> subagent: deep-debugger | model: opus
>
> You are root-cause-analyst. Find the root cause, not symptoms.
> ISSUE: $0 | SEVERITY: $1 | CONTEXT: $2
>
> 1. Exact failure mode
> 2. ALL possible causes
> 3. Evidence confirms/denies each
> 4. Minimal reproduction
>
> DO NOT propose fixes. Output: Root cause with confidence levels

### impact-assessor

> subagent: metacognitive-guard:arch-reviewer
>
> You are impact-assessor. Assess IMPACT.
> ISSUE: $0 | CONTEXT: $2
>
> 1. What depends on broken code?
> 2. What breaks if we change it?
> 3. Local or systemic?
> 4. Invariants at risk?
>
> Output: Impact map with risk levels

### context-gatherer

> subagent: feature-dev:code-explorer
>
> You are context-gatherer. Gather CONTEXT.
> ISSUE: $0 | CONTEXT: $2
>
> 1. All relevant code paths
> 2. Pattern used elsewhere?
> 3. Test coverage for this area
> 4. Recent changes?
>
> Output: Relevant code locations and patterns

---

## GATE 1: Analysis

```text
GATE 1: ANALYSIS → [status]
+--------------------------------------------+
| Agents: [3/3] completed                   |
| Root cause confidence: [X]%               |
| Impact: COMPLETE / INCOMPLETE             |
+--------------------------------------------+
| Root cause found → PROCEED                  |
| Otherwise → HALT                            |
+--------------------------------------------+
```

---

## PHASE 2: SOLUTION DESIGN — 2 Agents

Launch BOTH in ONE message.

### solution-architect

> subagent: feature-dev:code-architect | model: opus
>
> Design solutions from Phase 1 analysis.
>
> Per solution: what it fixes, code changes, regression risk, complexity (1-10), confidence (%).
> Rank by: confidence × impact / complexity.
> Output: Top 3 solutions with implementation plans

### devils-advocate

> subagent: feature-dev:code-reviewer
>
> CHALLENGE each proposed solution:
> What could go wrong? Assumptions? Edge cases? Better alternatives?
> Output: Risk analysis and counterarguments

---

## GATE 2: Design

```text
GATE 2: DESIGN → [status]
+--------------------------------------------+
| Solutions: [X] proposed                    |
| Top confidence: [X]%                       |
| Risks identified: [X]                      |
+--------------------------------------------+
| Viable solution → PROCEED                   |
| None viable → HALT                          |
+--------------------------------------------+
```

Select highest-ranked solution. Proceed.

---

## PHASE 3: IMPLEMENTATION — 1 Agent

### tdd-implementer

> subagent: feature-dev:code-architect | model: opus
>
> IMPLEMENT the approved solution. TDD:
>
> 1. Write failing test → 2. Minimal fix → 3. Verify pass → 4. Refactor
>
> Checklist: test written, fix implemented, test passing, no regressions.
> Output: Files changed + verification results

---

## GATE 3: Implementation

```text
GATE 3: IMPLEMENTATION → [status]
+--------------------------------------------+
| Implementation: COMPLETE / INCOMPLETE      |
| Tests: WRITTEN / MISSING                   |
| Compiles: YES / NO                         |
+--------------------------------------------+
| PROCEED / HALT                              |
+--------------------------------------------+
```

---

## PHASE 4: VERIFICATION

Run directly — build, test, and lint using the project's toolchain.

---

## FINAL REPORT

| Phase | Status | Key Findings |
|-------|--------|--------------|
| 1. Analysis | PASS/FAIL | [Root cause] |
| 2. Design | PASS/FAIL | [Chosen solution] |
| 3. Implementation | PASS/FAIL | [Files changed] |
| 4. Verification | PASS/FAIL | [Build/Test/Lint] |

**Issue:** $0 | **Status:** FIXED / BLOCKED | **Next Steps:** [if any]
