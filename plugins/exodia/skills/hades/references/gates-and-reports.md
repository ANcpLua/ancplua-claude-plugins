# Hades Gates, Cleanup, and Final Report

The three gates are pure predicates: `state -> PROCEED | HALT | COMPLETE`.
Each prints a status box and applies the verdict rules below.

---

## GATE 0: Audit Complete

```text
GATE 0: AUDIT -> [status]
SMART_ID: [value]
GOGGLES: [EQUIPPED | OFF]

+------------------------------------------------------------+
| Suppressions: [count] (fix: [n], false-positive: [n], upstream: [n])
| Dead Code:    [count] items ([lines] lines)
| Duplication:  [count] clusters
| Imports:      [count] issues
+------------------------------------------------------------+
| GOGGLES (if equipped):                                     |
|   Taste:      [n] findings (REDESIGN: [n], REFINE: [n])   |
|   Spec:       [n] violations (P1: [n], P2: [n], P3+: [n]) |
|   Compliance: [n] issues (CRITICAL: [n], WARNING: [n])     |
+------------------------------------------------------------+
| GUILLOTINE (if equipped):                                  |
|   Public symbols audited: [n]                              |
|     KEEP:      [n]   (real contracts, scope keeps them)    |
|     DOWNGRADE: [n]   (fake contracts → internal)           |
|     BREAK:     [n]   (real contracts → delete)             |
+------------------------------------------------------------+
| Cross-teammate messages: [count]
| Challenges resolved:     [count]
| Ownership conflicts:     [count] (resolved by lead)
+------------------------------------------------------------+
| Permit: ACTIVE (expires: [time])
| Ledger: [count] entries
+------------------------------------------------------------+
| VERDICT: PROCEED | HALT | SCAN_COMPLETE
+------------------------------------------------------------+
```

- `$2 = scan-only` -> SCAN_COMPLETE. **Write findings to `.eight-gates/artifacts/findings.json`**
  (enables auto-inherit). Present report. Revoke permit. Shut down. Done.
- Zero findings -> HALT. Nothing to clean. Revoke permit. Shut down. Done.
- Findings exist -> PROCEED. **Write findings to `.eight-gates/artifacts/findings.json`**.
  Shut down Phase 0. Spawn Phase 1.

---

## GATE 1: Elimination Complete

```text
GATE 1: ELIMINATION -> [status]
SMART_ID: [value]

+------------------------------------------------------------+
| Suppressions eliminated:  [n]/[total]
| Dead code deleted:        [n] items ([lines] lines)
| Duplication consolidated: [n] clusters
| Imports fixed:            [n] issues
| Public APIs broken:       [n] (--guillotine: downgrades + deletions)
+------------------------------------------------------------+
| Ledger entries:           [count] (verify == total actions taken)
| Break-manifest entries:   [count] (--guillotine, == BREAK tasks completed)
| Build: PASS | FAIL
| Tests: PASS | FAIL
+------------------------------------------------------------+
| VERDICT: PROCEED | HALT
+------------------------------------------------------------+
```

- Build/tests fail -> HALT. Lead diagnoses. Spawn targeted fix teammate.
- Tasks incomplete -> Wait or reassign.
- Guillotine BREAK task completed without a corresponding break-manifest entry -> HALT. Manifest is mandatory.
- All complete + build + tests pass + (if guillotine) manifest count == BREAK count -> PROCEED. Shut down Phase 1. Spawn Phase 2.

---

## GATE 2: Verification Complete

```text
GATE 2: VERIFICATION -> [status]
SMART_ID: [value]

+------------------------------------------------------------+
| Build:           CLEAN | WARNINGS ([count])
| Tests:           PASS ([n]) | FAIL ([n]) | SKIP ([n])
| Suppressions:    [count] remaining
| Ledger:          [count] entries (expected: [n])
| Challenger:      [n] claims confirmed, [n] challenged
+------------------------------------------------------------+
| GUILLOTINE (if equipped):                                  |
|   Axis 1 (shim-free):           PASS | FAIL ([n] hits)    |
|   Axis 2 (functionally equiv.): PASS | FAIL ([n] entries) |
|   Manifest validate:            PASS | FAIL                |
|   Break-manifest entries:       [n] (== Phase 1 BREAK count)
+------------------------------------------------------------+
| VERDICT: COMPLETE | ITERATE
+------------------------------------------------------------+
```

- Any remaining suppressions > 0 -> ITERATE. Back to Phase 1 targeting remaining items.
- Build warnings > 0 -> ITERATE.
- Ledger incomplete -> ITERATE. Log missing entries.
- Challenged claims unresolved -> ITERATE with targeted teammates.
- Guillotine Axis 1 fail (shim found in diff) -> ITERATE. Eliminator removes the shim.
- Guillotine Axis 2 fail (consumer call site not rewired and not deleted, or replacement test missing) -> ITERATE. Eliminator either rewires or deletes; cannot leave the gap.
- `break-manifest.sh validate` fail (entry has neither replacement nor justification) -> ITERATE. Eliminator fills the missing field.
- All zeros + all confirmed + ledger complete + (if guillotine) both axes pass + manifest valid -> COMPLETE.

---

## CLEANUP

1. Shut down all remaining teammates: SendMessage type="shutdown_request" to each
2. Wait for all shutdown_responses
3. If guillotine equipped: `plugins/exodia/scripts/smart/break-manifest.sh validate` (must exit 0)
4. Revoke deletion permit: `plugins/exodia/scripts/smart/permit.sh revoke`
5. Delete team: `TeamDelete: team_name = "hades-cleanup"`
6. Present final report

---

## If Connectors Available

- ~~github~~ Open a cleanup PR from Gate 1 output and block merge until Gate 2 passes
- ~~sonarqube~~ Push post-cleanup metrics for suppression count, duplication ratio, and coverage
- ~~slack~~ Post the final HADES CLEANUP REPORT summary to a team channel
- ~~linear~~ Auto-close suppression and dead-code issues resolved by the elimination phase

---

## FINAL REPORT

```text
+====================================================================+
|                    HADES CLEANUP REPORT                            |
+====================================================================+
| Smart ID: [SMART-YYYY-MM-DD-...]                                   |
| Scope: $0                                                          |
| Intensity: $2                                                      |
| Goggles: [EQUIPPED | OFF]                                          |
| Guillotine: [EQUIPPED | OFF]                                       |
| Phases: 12 base + 3 (goggles, P0) + 3 (guillotine) = 12..18 total  |
+====================================================================+
|                   BEFORE -> AFTER                                  |
|  Suppressions:    [n] -> 0                                         |
|  Dead code lines: [n] -> 0                                         |
|  Duplication:     [n] clusters -> 0                                |
|  Import issues:   [n] -> 0                                         |
|  Build warnings:  [n] -> 0                                         |
|  Public APIs:     [n] -> [n - broken]  (--guillotine)              |
+====================================================================+
|                   GOGGLES (if equipped)                             |
|  Taste violations:      [n] -> 0  (REDESIGN: [n], REFINE: [n])    |
|  Spec violations:       [n] -> 0  (P1: [n], P2: [n], P3+: [n])   |
|  Compliance violations: [n] -> 0  (CRITICAL: [n], WARNING: [n])   |
|  Pipeline flow: taste → spec → compliance                          |
+====================================================================+
|                   GUILLOTINE (if equipped)                          |
|  Public symbols audited:    [n]                                     |
|    KEEP:                    [n]                                     |
|    DOWNGRADE -> internal:   [n]                                     |
|    BREAK -> deleted:        [n]                                     |
|  Break-manifest entries:    [n]                                     |
|  Axis 1 (shim-free):        PASS                                    |
|  Axis 2 (functionally eq.): PASS                                    |
|  Manifest validated:        PASS                                    |
|  Pure removals:             [n] (with explicit justification)       |
|  Replacements wired:        [n] (with consumer rewire)              |
+====================================================================+
|                   SMART INFRASTRUCTURE                             |
|  Ledger entries:           [n]                                     |
|  Break-manifest entries:   [n] (--guillotine)                      |
|  Permit lifecycle:         created -> active -> revoked            |
|  Permit TTL:               [n]s (used [n]s)                        |
+====================================================================+
|                   DEBATE METRICS                                   |
|  Cross-teammate messages: [n]                                      |
|  Challenges raised: [n]                                            |
|  Challenges resolved: [n]                                          |
|  Ownership conflicts: [n]                                          |
+====================================================================+
|                   VERIFICATION                                     |
|  Build: PASS (zero warnings)                                       |
|  Tests: PASS ([n] passed, 0 skipped)                               |
|  Iterations: [n]                                                   |
|  Challenger confirmations: [n]/[n]                                 |
+====================================================================+
```

| Category               | Before     | After | Ledger Entries | Manifest Entries | Debate Messages |
|------------------------|------------|-------|----------------|------------------|-----------------|
| Suppressions           | X          | 0     | [n]            | --               | [n]             |
| Dead code              | X lines    | 0     | [n]            | --               | [n]             |
| Duplication            | X clusters | 0     | [n]            | --               | [n]             |
| Imports                | X issues   | 0     | [n]            | --               | [n]             |
| Build warnings         | X          | 0     | --             | --               | --              |
| Taste (goggles)        | X          | 0     | [n]            | --               | [n]             |
| Spec (goggles)         | X          | 0     | [n]            | --               | [n]             |
| Compliance (goggles)   | X          | 0     | [n]            | --               | [n]             |
| Public-API (guillotine)| X          | [n]   | [n]            | [n]              | [n]             |
