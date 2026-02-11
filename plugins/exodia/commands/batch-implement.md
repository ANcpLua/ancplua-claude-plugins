---
description: "IF implementing multiple similar items THEN use this. Pattern extraction->parallel implement (1 agent per item)->consistency review->verify. Endpoints, tests, migrations, fixes."
allowed-tools: Task, Bash, TodoWrite
---

# BATCH IMPLEMENT — Parallel Items with Shared Pattern

> Extract pattern. Parallelize. Review consistency. Verify.

**Type:** $0 (diagnostics|tests|endpoints|features|fixes|migrations)
**Items:** $1 (comma-separated list)

---

## TEAM ARCHITECTURE

```text
BATCH LEAD (You — Orchestrator)
│
├─ Phase 1: PATTERN EXTRACTION (1 agent)
│  └── template-extractor
│  └── → template ready
│
├─ Phase 2: PARALLEL IMPLEMENTATION (1 agent per item)
│  ├── implementer-item-1 ... implementer-item-N
│  └── GATE → all complete
│
├─ Phase 3: CONSISTENCY REVIEW (1 agent)
│  └── consistency-reviewer
│  └── → fix issues found
│
└─ Phase 4: VERIFICATION (direct)
   └── Build + Test + Lint → DONE | BLOCKED
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**RUN ALL 4 PHASES WITHOUT STOPPING.**

1. Launch 1 template extractor
2. Launch 1 implementer PER ITEM in ONE message (parallel)
3. Launch 1 consistency reviewer
4. Run verification directly

Use TodoWrite: one todo per item, mark complete as each finishes.

**YOUR NEXT MESSAGE: 1 Task tool call for Phase 1. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: PATTERN EXTRACTION — 1 Agent

### template-extractor
> subagent: feature-dev:code-explorer
> You are template-extractor. Extract the implementation pattern.
> TYPE: $0 | ITEMS: $1
> Find: existing implementations of this type, common structure, required boilerplate, test patterns, registration/wiring.
> Create template: file structure, code skeleton, naming conventions, integration points.
> Output: Implementation template with placeholders

---

## PHASE 2: PARALLEL IMPLEMENTATION

Parse $1 (comma-separated). Launch ONE agent PER ITEM in ONE message.

### implementer-item-N (one per item)
> subagent: feature-dev:code-architect
> IMPLEMENT: [ITEM_NAME from $1] | TYPE: $0
> Using template from Phase 1. Follow TDD:
> 1. Write failing test → 2. Implement → 3. Verify pass
> Checklist: follows pattern, unit test, implementation, registered/wired, no copy-paste errors.
> Output: Files created with paths

---

## GATE: Implementation Complete

```text
BATCH GATE:
+------------------------------------------------------------+
| Items: [X/Y] completed                                    |
+------------------------------------------------------------+
| All complete → PROCEED to review                            |
| Failures → report + continue with successful items          |
+------------------------------------------------------------+
```

---

## PHASE 3: CONSISTENCY REVIEW — 1 Agent

### consistency-reviewer
> subagent: feature-dev:code-reviewer
> REVIEW all new implementations for consistency:
> 1. Consistent naming across all items
> 2. No conflicts between items
> 3. All registrations complete
> 4. Tests follow same pattern
> 5. No duplicate code that should be shared
> Output: Issues found + recommendations

Fix any issues found, then proceed.

---

## PHASE 4: VERIFICATION

Run build, test, and lint using the project's toolchain.

---

## TYPE-SPECIFIC GUIDANCE

| Type | Key Steps |
|------|-----------|
| **diagnostics** | Descriptor → analyzer logic → SupportedDiagnostics → unit test → code fix test |
| **tests** | Identify untested paths → happy path → edge cases → error conditions → verify coverage |
| **endpoints** | Route + method → DTOs → handler → validation → OpenAPI → integration test |
| **fixes** | Locate issue → regression test (failing) → minimal fix → verify → check similar |
| **migrations** | Source pattern → target pattern → transformation → compile → test → update docs |

---

## FINAL REPORT

| Item | Status | Files | Tests |
|------|--------|-------|-------|
| [item1] | Done/Failed | [paths] | Pass/Fail |
| [item2] | Done/Failed | [paths] | Pass/Fail |

**Total:** X/Y items implemented successfully
