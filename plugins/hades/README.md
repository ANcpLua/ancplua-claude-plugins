# Hades

The rules enforcer. Exodia's counterpart.

Exodia = God. Creation. 8 skills that build, fix, review, compete.
Hades = Satan. Judgment. 3 phases that audit, eliminate, verify.

Hades follows the rules. Else we can't play games.

## Skills

| Skill | Phase | What it does |
|-------|-------|-------------|
| `/hades:judge` | 0 | 4 debating auditors (suppressions, deadcode, duplication, imports). Returns PROCEED/HALT. |
| `/hades:enforce` | 1 | 4 eliminators claim audit tasks, fix with file ownership protocol. Plan approval for structural changes. |
| `/hades:verify` | 2 | 4 cross-checking verifiers (build, tests, grep, challenger). Returns COMPLETE/ITERATE. |

## The Pipeline

```text
/hades:judge    → Phase 0: 4 auditors debate       → HALT?
/hades:enforce  → Phase 1: 4 eliminators fix        → PROCEED?
/hades:verify   → Phase 2: 4 verifiers challenge    → COMPLETE | ITERATE
```

3 phases. 12 teammates total. Railway-oriented: each phase feeds the next.

Without Hades, Exodia builds garbage confidently.
Without Exodia, Hades has nothing to judge.

## Phase 0: Auditors (Debate)

| Auditor | Lens | Debates with |
|---------|------|-------------|
| smart-audit-suppressions | Warning suppressions, pragmas, NoWarn | deadcode, duplication |
| smart-audit-deadcode | Unused code, orphan files, unreachable branches | suppressions, duplication |
| smart-audit-duplication | Copy-paste clusters, parallel implementations | deadcode, imports |
| smart-audit-imports | Unused imports, circular deps, wrong paths | deadcode, duplication |

Auditors MESSAGE each other to challenge findings. Creates tasks for Phase 1.

## Phase 1: Eliminators (Fix)

| Eliminator | Fixes | Coordinates with |
|-----------|-------|-----------------|
| smart-elim-suppressions | Removes suppressions by fixing underlying code | deadcode |
| smart-elim-deadcode | Deletes dead code, orphan files | duplication |
| smart-elim-duplication | Consolidates duplicates to single source | imports |
| smart-elim-imports | Fixes import structure, removes unused | lead |

File ownership protocol: each file assigned to exactly ONE eliminator. Plan approval for structural changes.

## Phase 2: Verifiers (Challenge)

| Verifier | Checks | Challenged by |
|----------|--------|--------------|
| smart-verify-build | Build clean, zero warnings (all configs) | challenger |
| smart-verify-tests | All tests pass, none deleted/skipped | challenger |
| smart-verify-grep | Zero remaining suppressions/debt | challenger |
| smart-verify-challenger | Independently verifies other 3 claims | — |

Challenger attacks evidence. Only unanimous confirmation = COMPLETE.

## HALT Conditions

- Any P0 violation = HALT
- More than 3 P1 violations = HALT
- Build or test failure = HALT
- Remaining suppressions > 0 = ITERATE
- Challenger disputes unresolved = ITERATE

## Requires

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## LAW 2: Agent Loop

```text
Execute (Exodia builds)
    -> Evaluate (Hades judges — 4 auditors)
        -> Decide (PROCEED / HALT)
            -> If HALT: Enforce (4 eliminators)
                -> Verify (4 verifiers + challenger)
                    -> COMPLETE or ITERATE
```
