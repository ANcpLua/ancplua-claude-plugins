---
name: fix
description: "IF bug fix needed THEN use this. 4 gated phases, 8 agents (standard) or 16 (maximum). For P0 critical → turbo-fix. From audit findings → fix-pipeline."
allowed-tools: Task, Bash, TodoWrite
---

# FIX — Gated Bug Resolution Pipeline

> Execute → Evaluate → Decide. Every phase a gate. Every gate a verdict.

**Issue:** $1
**Severity:** $2 (default: P1 | P0|P1|P2|P3)
**Parallelism:** $3 (default: standard | maximum|standard)
**Mode:** $4 (default: balanced | aggressive|balanced|conservative)
**Quick:** $5 (default: false — skip devil's advocate)

---

## TEAM ARCHITECTURE

```text
FIX LEAD (You — Orchestrator)
│
├─ Phase 1: ANALYSIS (standard: 3, maximum: 6)
│  ├── root-cause-hunter
│  ├── impact-assessor
│  ├── code-explorer
│  ├── history-detective       ← maximum only
│  ├── pattern-matcher         ← maximum only
│  └── test-analyzer           ← maximum only
│  └── GATE 1 → PROCEED | HALT
│
├─ Phase 2: DESIGN (standard: 2, maximum: 4)
│  ├── solution-architect[-a/-b/-c]
│  └── devils-advocate         ← skip if $5=true
│  └── GATE 2 → PROCEED | HALT
│
├─ Phase 3: IMPLEMENTATION (standard: 1, maximum: 3)
│  ├── tdd-implementer
│  ├── test-writer             ← maximum only
│  └── docs-updater            ← maximum only
│  └── GATE 3 → PROCEED | HALT
│
└─ Phase 4: VERIFICATION (direct — no agents)
   └── Build + Test + Lint → FIXED | BLOCKED
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**YOU ORCHESTRATE. AGENTS FIX.**

1. Launch Phase 1 agents in ONE message (Task tool, parallel)
2. Evaluate GATE 1
3. Launch Phase 2, evaluate GATE 2
4. Launch Phase 3, evaluate GATE 3
5. Run Phase 4 verification directly
6. Present summary

**DO NOT** ask "should I continue?" between phases.
**ONLY STOP** if: build fails, tests fail, or unrecoverable error.

**YOUR NEXT MESSAGE: Launch Phase 1 Task tool calls. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: ANALYSIS

Standard: 3 agents. Maximum ($3=maximum): all 6. Launch ALL in ONE message.

### root-cause-hunter

> subagent: deep-debugger | model: opus
>
> You are root-cause-hunter. Find the ROOT CAUSE.
> ISSUE: $1 | SEVERITY: $2
>
> 1. Exact failure mode
> 2. ALL possible causes (5+)
> 3. Evidence for/against each
> 4. Confidence ranking (percentage)
>
> Output: Root cause with confidence level

### impact-assessor

> subagent: metacognitive-guard:arch-reviewer | model: opus
>
> You are impact-assessor. Map system IMPACT.
> ISSUE: $1
>
> 1. What depends on broken code?
> 2. Ripple effects of changes?
> 3. Local or systemic?
> 4. Invariants at risk?
>
> Output: Impact map with risk levels

### code-explorer

> subagent: feature-dev:code-explorer
>
> You are code-explorer. Find ALL relevant code.
> ISSUE: $1
>
> 1. All code paths involved
> 2. Similar patterns elsewhere
> 3. Test coverage for this area
> 4. Recent changes
>
> Output: File:line map of relevant code

### history-detective ← maximum only

> subagent: Explore
>
> You are history-detective. Find the HISTORY.
> ISSUE: $1
>
> 1. When did this break? (git blame/log)
> 2. What commit introduced it?
> 3. Was this working before?
> 4. Related issues/PRs?
>
> Output: Timeline of changes

### pattern-matcher ← maximum only

> subagent: feature-dev:code-explorer
>
> You are pattern-matcher. Find SIMILAR bugs.
> ISSUE: $1
>
> 1. Same pattern elsewhere?
> 2. Similar bugs fixed before?
> 3. Common anti-patterns?
>
> Output: Similar locations with same bug pattern

### test-analyzer ← maximum only

> subagent: feature-dev:code-reviewer
>
> You are test-analyzer. Analyze TEST coverage gaps.
> ISSUE: $1
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
| Agents: [X/Y] completed                   |
| Root cause confidence: [X]%               |
| Impact: COMPLETE / INCOMPLETE             |
+--------------------------------------------+
| >=80% + root cause → PROCEED               |
| Otherwise → HALT                            |
+--------------------------------------------+
```

---

## PHASE 2: DESIGN

Standard: 1 architect + devil's advocate. Maximum: 3 architects + devil's advocate.
Skip devil's advocate if $5=true.

### solution-architect (standard) / solution-architect-a (maximum: MINIMAL CHANGE)

> subagent: feature-dev:code-architect | model: opus
>
> Design the best solution(s) from Phase 1 analysis.
>
> Per solution: what it fixes, code changes, regression risk, complexity (1-10), confidence (%).
> Rank by: confidence × impact / complexity.
>
> Output: Top 3 solutions with implementation plans

### solution-architect-b ← maximum only

> subagent: feature-dev:code-architect | model: opus
>
> Design Solution B: ROBUST LONG-TERM approach.
> Fix + prevent future issues. Better abstractions.
> Output: Solution B with implementation plan

### solution-architect-c ← maximum only

> subagent: feature-dev:code-architect | model: opus
>
> Design Solution C: ALTERNATIVE APPROACH.
> Different paradigm/pattern. Unconventional angles.
> Output: Solution C with implementation plan

### devils-advocate ← skip if $5=true

> subagent: feature-dev:code-reviewer
>
> CHALLENGE each proposed solution:
> What could go wrong? Hidden assumptions? Edge cases? Better alternatives?
> Be HARSH. Output: Risk analysis per solution

---

## GATE 2: Design

```text
GATE 2: DESIGN → [status]
+--------------------------------------------+
| Solutions proposed: [X]                    |
| Top confidence: [X]%                       |
| Devil's advocate: PASS / CHALLENGED        |
+--------------------------------------------+
| Viable solution → PROCEED                   |
| None viable → HALT                          |
+--------------------------------------------+
```

Select best solution. Proceed.

---

## PHASE 3: IMPLEMENTATION

Standard: 1 TDD implementer. Maximum: 3 agents.

### tdd-implementer (standard)

> subagent: feature-dev:code-architect | model: opus
>
> IMPLEMENT the approved solution. TDD:
> 1. Write failing test → 2. Minimal fix → 3. Verify pass → 4. Refactor
>
> Output: Files changed + verification results

### test-writer ← maximum only

> subagent: feature-dev:code-architect
>
> WRITE TESTS FIRST: failing unit test, edge cases, regression test.
> DO NOT implement the fix. Output: Test files with paths

### docs-updater ← maximum only

> subagent: Explore
>
> CHECK what docs need updating: README, API docs, CHANGELOG, code comments.
> Output: Documentation updates needed

---

## GATE 3: Implementation

```text
GATE 3: IMPLEMENTATION → [status]
+--------------------------------------------+
| Implementation: COMPLETE / INCOMPLETE      |
| Tests: WRITTEN / MISSING                   |
| Compiles: YES / NO                         |
+--------------------------------------------+
| All green → PROCEED to verification         |
| Otherwise → HALT                            |
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
|                      FIX COMPLETE                            |
+==============================================================+
| Issue: $1 | Severity: $2 | Parallelism: $3 | Mode: $4        |
+--------------------------------------------------------------+
| Phase 1 Analysis:   [X/Y] agents | Root cause: [summary]     |
| Phase 2 Design:     [X/Y] agents | Solution: [name]          |
| Phase 3 Implement:  [X/Y] agents | Files: [count]            |
| Phase 4 Verify:     Build/Test/Lint: [results]               |
+--------------------------------------------------------------+
| STATUS: FIXED / BLOCKED                                      |
+==============================================================+
```
