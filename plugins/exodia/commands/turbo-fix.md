---
description: "IF P0 critical bug THEN use this. 13 agents, 4 phases, maximum parallelism. For P1-P3 → use fix. From audit → fix-pipeline."
allowed-tools: Task, Bash, TodoWrite
---

# TURBO FIX — Maximum Parallelism Emergency Pipeline

> P0 emergency. 13 agents. 4 phases. No waiting.

**Issue:** $0
**Severity:** $1 (default: P0)
**Context:** $2 (default: .)

---

## TEAM ARCHITECTURE

```text
TURBO LEAD (You — Orchestrator)
│
├─ Phase 1: SWARM ANALYSIS (6 agents parallel)
│  ├── root-cause-hunter       ├── history-detective
│  ├── impact-assessor         ├── pattern-matcher
│  ├── code-explorer           └── test-analyzer
│  └── GATE 1 → PROCEED | HALT
│
├─ Phase 2: SOLUTION SWARM (4 agents parallel)
│  ├── solution-architect-a (minimal)
│  ├── solution-architect-b (robust)
│  ├── solution-architect-c (alternative)
│  └── devils-advocate
│  └── GATE 2 → PROCEED | HALT
│
├─ Phase 3: IMPLEMENTATION (2 agents parallel)
│  ├── tdd-implementer (tests THEN code — atomic)
│  └── docs-updater (read-only research)
│  └── GATE 3 → PROCEED | HALT
│
└─ Phase 4: VERIFICATION (direct)
   └── Build + Test + Lint → FIXED | BLOCKED
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, read `.eight-gates/artifacts/findings.json`.
Filter by `finding.id` matching `$0`. If a match exists, inject its `fix`, `files`, and `severity` into
all Phase 1 agent prompts as pre-existing context. Skip re-discovery of already-known information.


**YOU ORCHESTRATE. 13 AGENTS FIX.**

1. Launch 6 Phase 1 agents in ONE message
2. GATE 1, then launch 4 Phase 2 agents in ONE message
3. Select best, GATE 2, then launch 2 Phase 3 agents in ONE message
4. GATE 3, run Phase 4 verification directly

**DO NOT** pause between phases.
**YOUR NEXT MESSAGE: 6 Task tool calls for Phase 1. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: SWARM ANALYSIS — 6 Agents

Launch ALL 6 in ONE message.

### root-cause-hunter

> subagent: deep-debugger | model: opus
>
> You are root-cause-hunter. Find the ROOT CAUSE.
> ISSUE: $0 | CONTEXT: $2
>
> 1. Exact failure mode
> 2. ALL possible causes (5+)
> 3. Evidence for/against each
> 4. Confidence ranking
>
> Output: Root cause with 90%+ confidence

### impact-assessor

> subagent: metacognitive-guard:arch-reviewer | model: opus
>
> You are impact-assessor. Map system IMPACT.
> ISSUE: $0 | CONTEXT: $2
>
> 1. What depends on broken code?
> 2. Ripple effects of changes?
> 3. Invariants at risk?
> 4. Local or systemic?
>
> Output: Impact map with risk levels

### code-explorer

> subagent: feature-dev:code-explorer
>
> You are code-explorer. Find ALL relevant code.
> ISSUE: $0 | CONTEXT: $2
>
> 1. All code paths involved
> 2. Similar patterns elsewhere
> 3. Test coverage for this area
> 4. Recent changes
>
> Output: File:line map of relevant code

### history-detective

> subagent: Explore
>
> You are history-detective. Find the HISTORY.
> ISSUE: $0 | CONTEXT: $2
>
> 1. When did this break? (git blame/log)
> 2. What commit introduced it?
> 3. Was this working before?
> 4. Related issues/PRs?
>
> Output: Timeline of changes

### pattern-matcher

> subagent: feature-dev:code-explorer
>
> You are pattern-matcher. Find SIMILAR bugs.
> ISSUE: $0 | CONTEXT: $2
>
> 1. Same pattern elsewhere?
> 2. Similar bugs fixed before?
> 3. Common anti-patterns? Systemic issues?
>
> Output: Similar locations with same bug pattern

### test-analyzer

> subagent: feature-dev:code-reviewer
>
> You are test-analyzer. Analyze TEST coverage gaps.
> ISSUE: $0 | CONTEXT: $2
>
> 1. What tests exist for this area?
> 2. Why didn't tests catch this?
> 3. What tests are missing?
>
> Output: Test gap analysis

---

## GATE 1: Analysis

```text
GATE 1: ANALYSIS → [status]
+--------------------------------------------+
| Agents: [6/6] completed                   |
| Root cause confidence: [X]%               |
| Impact: COMPLETE / INCOMPLETE             |
+--------------------------------------------+
| >=80% + root cause → PROCEED               |
| Otherwise → HALT                            |
+--------------------------------------------+
```

---

## PHASE 2: SOLUTION SWARM — 4 Agents

Launch ALL 4 in ONE message.

### solution-architect-a

> subagent: feature-dev:code-architect | model: opus
>
> Design Solution A: MINIMAL CHANGE.
> Smallest possible fix. Code changes. Risk assessment. Steps.
> Output: Solution A with implementation plan

### solution-architect-b

> subagent: feature-dev:code-architect | model: opus
>
> Design Solution B: ROBUST LONG-TERM.
> Fix + prevent future issues. Refactoring if needed. Better abstractions.
> Output: Solution B with implementation plan

### solution-architect-c

> subagent: feature-dev:code-architect | model: opus
>
> Design Solution C: ALTERNATIVE APPROACH.
> Different paradigm/pattern. Unconventional solutions. Trade-offs.
> Output: Solution C with implementation plan

### devils-advocate

> subagent: feature-dev:code-reviewer
>
> ATTACK all proposed solutions. For each:
> What will break? Hidden assumptions? Edge cases? Why is this wrong?
> Be HARSH. Output: Risk analysis per solution

---

## GATE 2: Design

```text
GATE 2: DESIGN → [status]
+--------------------------------------------+
| Solutions: [3] proposed                    |
| Devil's advocate: [findings]               |
| Selected: Solution [A/B/C]                 |
+--------------------------------------------+
| PROCEED / HALT                              |
+--------------------------------------------+
```

Select best solution. Proceed.

---

## PHASE 3: IMPLEMENTATION — 2 Agents

Launch BOTH in ONE message.

### tdd-implementer

> subagent: feature-dev:code-architect | model: opus
>
> IMPLEMENT the selected solution using TDD (atomic — tests and code in ONE agent):
> 1. Write failing test (RED) — run it, confirm failure
> 2. Write minimal fix (GREEN) — run it, confirm pass
> 3. Edge case tests + regression test
> 4. Refactor if needed — tests must still pass
>
> DO NOT split test-writing from implementation. One agent owns all source changes.
> Output: Changed files with diffs + test results

### docs-updater

> subagent: Explore
>
> CHECK what docs need updating: README, API docs, CHANGELOG, code comments.
> DO NOT modify source or test files — read-only research.
> Output: Documentation updates needed

---

## GATE 3: Implementation

```text
GATE 3: IMPLEMENTATION → [status]
+--------------------------------------------+
| Implementation: COMPLETE / INCOMPLETE      |
| TDD cycle: RED→GREEN / SKIPPED            |
| Compiles: YES / NO                         |
+--------------------------------------------+
| PROCEED / HALT                              |
+--------------------------------------------+
```

---

## PHASE 4: VERIFICATION

Run directly:

```bash
dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1
dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
```

---

## FINAL REPORT

```text
+==============================================================+
|                    TURBO FIX COMPLETE                        |
+==============================================================+
| Issue: $0 | Severity: $1                                      |
+--------------------------------------------------------------+
| Phase 1 Analysis:   6/6 agents | Root cause: [summary]       |
| Phase 2 Solutions:  4/4 agents | Selected: [A/B/C]           |
| Phase 3 Implement:  2/2 agents | Files: [count]              |
| Phase 4 Verify:     Build/Test/Lint: [results]               |
+--------------------------------------------------------------+
| TOTAL AGENTS: 13 | STATUS: FIXED / BLOCKED                   |
+==============================================================+
```
