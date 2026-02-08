---
name: hades
description: "IF cleanup/elimination needed THEN use this. IF zero suppressions THEN this. IF dead code THEN this. IF duplication THEN this. Smart-Hades: every session gets a Smart ID, deletion permit, and audit ledger. Team lead skill — spawns 4 debate teammates per phase. Ignores public API, semver, changelog. Pure functional destruction. Idempotent: same input, same output. Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1."
argument-hint: "[scope] [focus] [intensity]"
allowed-tools: Task, Bash, TodoWrite
hooks:
  TeammateIdle:
    - hooks:
        - type: command
          command: "bash -c 'INPUT=$(cat); TEAMMATE=$(echo \"$INPUT\" | jq -r .teammate_name); if echo \"$TEAMMATE\" | grep -q \"smart-elim\"; then COUNT=$(plugins/exodia/scripts/smart/ledger.sh count 2>/dev/null | grep -o \"[0-9]*\" | head -1); if [ \"${COUNT:-0}\" = \"0\" ]; then echo \"No ledger entries found. Log your deletions before going idle.\" >&2; exit 2; fi; fi; exit 0'"
          timeout: 10
          statusMessage: "Verifying ledger entries before idle..."
  TaskCompleted:
    - hooks:
        - type: prompt
          prompt: "A Hades cleanup task is being marked complete. Task: $ARGUMENTS. Verify: 1) Does the task subject mention a specific file or action? 2) If it involves deletion/removal, was a ledger entry likely created? 3) Is the task description specific enough to be verifiable? Respond {\"ok\": true} if the task completion seems legitimate, or {\"ok\": false, \"reason\": \"...\"} if it looks like the task was completed without actual work."
          model: haiku
          timeout: 15
          statusMessage: "Validating task completion..."
---

# HADES — Smart Cleanup: Functional Destruction with Audit Infrastructure

> Same input -> same output. Every phase is a pure transformation.
> Every gate is a pure predicate: state -> PROCEED | HALT.
> Every deletion is permitted, logged, and auditable.

**Scope:** $1 (default: . — file path | directory | repo | cross-repo)
**Focus:** $2 (default: all — all|suppressions|dead-code|duplication|imports)
**Intensity:** $3 (default: full — full|scan-only)

**Smart Infrastructure:** `plugins/exodia/scripts/smart/`

**Hookify guards (optional):** Copy from `plugins/exodia/scripts/smart/hookify-rules/` to your project:

```bash
cp plugins/exodia/scripts/smart/hookify-rules/*.local.md .
# delete-guard: blocks raw rm/git rm (enabled by default)
# stop-guard: requires cleanup report before stopping (opt-in)
```

**Teammate prompt templates:** See [templates/](templates/) for full prompts:

- [auditors.md](templates/auditors.md) — Phase 0 audit teammates
- [eliminators.md](templates/eliminators.md) — Phase 1 elimination teammates
- [verifiers.md](templates/verifiers.md) — Phase 2 verification teammates

---

## IDENTITY

Hades is destruction. Functional. Idempotent. Rule-bound. Auditable.

Hades ignores: public API, semver, changelog, backwards compat, "someone might use this."
Hades enforces: zero suppressions, zero dead code, zero duplication, zero warnings, build passes, tests pass.
Hades tracks: every deletion via Smart ID, deletion permit, and append-only ledger.
Hades follows the rules — else we can't play games.

---

## SMART INFRASTRUCTURE

```text
.smart/                          <- gitignored, session-local
├── delete-ledger.jsonl          <- append-only audit log (JSONL)
└── delete-permit.json           <- active deletion permit (TTL-based)

plugins/exodia/scripts/smart/    <- checked-in tooling
├── smart-id.sh                  <- SMART-YYYY-MM-DD-<timestamp><random>
├── ledger.sh                    <- init | append | query | count
├── permit.sh                    <- create | validate | revoke | show
└── hookify-rules/
    ├── hookify.smart-hades-delete-guard.local.md   <- blocks raw rm/git rm
    └── hookify.smart-hades-stop-guard.local.md     <- opt-in completion guard
```

**Smart ID format:** `SMART-YYYY-MM-DD-<10-digit-epoch><20-char-random>`
**Ledger entry:** `{"ts","smart_id","action","path","reason","agent","git_sha"}`
**Permit:** `{"smart_id","created_at","expires_at","ttl","expires_epoch","paths","status"}`

---

## TEAM ARCHITECTURE

```text
HADES (Lead — Delegate Mode)
│
├─ INIT: Generate Smart ID, create deletion permit, init ledger
│
├─ Phase 0: AUDIT (4 Debating Auditors) — see templates/auditors.md
│  ├── smart-audit-suppressions
│  ├── smart-audit-deadcode
│  ├── smart-audit-duplication
│  └── smart-audit-imports
│  │   ↕ debate via messaging ↕
│  └── GATE 0 -> PROCEED | HALT | SCAN_COMPLETE
│
├─ Phase 1: ELIMINATION (4 Debating Eliminators) — see templates/eliminators.md
│  ├── smart-elim-suppressions
│  ├── smart-elim-deadcode
│  ├── smart-elim-duplication
│  └── smart-elim-imports
│  │   ↕ coordinate via messaging ↕
│  │   ↕ log every deletion to ledger ↕
│  └── GATE 1 -> PROCEED | HALT
│
└─ Phase 2: VERIFICATION (4 Cross-Checking Verifiers) — see templates/verifiers.md
   ├── smart-verify-build
   ├── smart-verify-tests
   ├── smart-verify-grep
   └── smart-verify-challenger
       ↕ challenge each other's claims ↕
       ↕ verify ledger completeness ↕
   └── GATE 2 -> COMPLETE | ITERATE (back to Phase 1)
```

**Concurrency:** 4 teammates per phase. Shut down before spawning next phase.
**File ownership:** Each teammate owns disjoint files. Lead resolves conflicts.
**Task sizing:** 5-6 tasks per teammate. No kanban overflow.

---

<CRITICAL_EXECUTION_REQUIREMENT>

**YOU ARE THE TEAM LEAD. DELEGATE MODE.**

**STEP 0 — Smart Infrastructure Init (before any teammates):**

```bash
# Generate session Smart ID
SMART_ID="$(plugins/exodia/scripts/smart/smart-id.sh generate)"

# Initialize ledger
plugins/exodia/scripts/smart/ledger.sh init

# Create deletion permit for scope (auto-revoked at cleanup)
plugins/exodia/scripts/smart/permit.sh create "$SMART_ID" "$1" --ttl=3600
```

Store `$SMART_ID` — pass it to every teammate prompt.

**STEP 0b — Determine Scope:**

```bash
# Staged + unstaged changes
git diff --cached --name-only
git diff --name-only

# If nothing changed, check last commit
git diff HEAD~1 --name-only

# If $1 is a path, scope to that path
```

Produce a file list. This goes into EVERY teammate's prompt.

**STEPS 1-8 — Team Execution:**

1. Create agent team: `Create an agent team for codebase cleanup`
2. Enter delegate mode (Shift+Tab) — you coordinate, never implement
3. Spawn Phase 0 (4 auditors from [templates/auditors.md](templates/auditors.md)), require plan approval before they start
4. Wait for debate to converge, evaluate GATE 0
5. Shut down Phase 0 teammates, spawn Phase 1 (4 eliminators from [templates/eliminators.md](templates/eliminators.md))
6. Wait for elimination, evaluate GATE 1
7. Shut down Phase 1 teammates, spawn Phase 2 (4 verifiers from [templates/verifiers.md](templates/verifiers.md))
8. If GATE 2 = ITERATE, repeat Phase 1. If COMPLETE, clean up team.

**STEP 9 — Cleanup (after COMPLETE):**

```bash
# Revoke deletion permit
plugins/exodia/scripts/smart/permit.sh revoke

# Show ledger summary
plugins/exodia/scripts/smart/ledger.sh count
```

**Fallback:** If Agent Teams unavailable, use Task tool with
`subagent_type: general-purpose`, 4 agents per phase.

**YOUR NEXT ACTION: Run Step 0 (Smart Init), then create team and spawn Phase 0.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## GATE 0: Audit Complete

```text
GATE 0: AUDIT -> [status]
SMART_ID: [value]

+------------------------------------------------------------+
| Suppressions: [count] (fix: [n], false-positive: [n], upstream: [n])
| Dead Code:    [count] items ([lines] lines)
| Duplication:  [count] clusters
| Imports:      [count] issues
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

- $3 = scan-only -> SCAN_COMPLETE. Present report. Revoke permit. Shut down. Done.
- Zero findings -> HALT. Nothing to clean. Revoke permit. Shut down. Done.
- Findings exist -> PROCEED. Shut down Phase 0. Spawn Phase 1.

---

## GATE 1: Elimination Complete

```text
GATE 1: ELIMINATION -> [status]
SMART_ID: [value]

+------------------------------------------------------------+
| Suppressions eliminated: [n]/[total]
| Dead code deleted:       [n] items ([lines] lines)
| Duplication consolidated: [n] clusters
| Imports fixed:           [n] issues
+------------------------------------------------------------+
| Ledger entries: [count] (verify == total actions taken)
| Build: PASS | FAIL
| Tests: PASS | FAIL
+------------------------------------------------------------+
| VERDICT: PROCEED | HALT
+------------------------------------------------------------+
```

- Build/tests fail -> HALT. Lead diagnoses. Spawn targeted fix teammate.
- Tasks incomplete -> Wait or reassign.
- All complete + build + tests pass -> PROCEED. Shut down Phase 1. Spawn Phase 2.

---

## GATE 2: Verification Complete

```text
GATE 2: VERIFICATION -> [status]
SMART_ID: [value]

+------------------------------------------------------------+
| Build:        CLEAN | WARNINGS ([count])
| Tests:        PASS ([n]) | FAIL ([n]) | SKIP ([n])
| Suppressions: [count] remaining
| Ledger:       [count] entries (expected: [n])
| Challenger:   [n] claims confirmed, [n] challenged
+------------------------------------------------------------+
| VERDICT: COMPLETE | ITERATE
+------------------------------------------------------------+
```

- Any remaining suppressions > 0 -> ITERATE. Back to Phase 1 targeting remaining items.
- Build warnings > 0 -> ITERATE.
- Ledger incomplete -> ITERATE. Log missing entries.
- Challenged claims unresolved -> ITERATE with targeted teammates.
- All zeros + all confirmed + ledger complete -> COMPLETE.

---

## CLEANUP

1. Shut down all remaining teammates
2. Revoke deletion permit: `plugins/exodia/scripts/smart/permit.sh revoke`
3. `Clean up the team`
4. Present final report

---

## FINAL REPORT

```text
+====================================================================+
|                    HADES CLEANUP REPORT                            |
+====================================================================+
| Smart ID: [SMART-YYYY-MM-DD-...]                                   |
| Scope: $1                                                          |
| Intensity: $3                                                      |
| Phases: 3 x 4 teammates = 12 total spawned                        |
+====================================================================+
|                   BEFORE -> AFTER                                  |
|  Suppressions:    [n] -> 0                                         |
|  Dead code lines: [n] -> 0                                         |
|  Duplication:     [n] clusters -> 0                                |
|  Import issues:   [n] -> 0                                         |
|  Build warnings:  [n] -> 0                                         |
+====================================================================+
|                   SMART INFRASTRUCTURE                             |
|  Ledger entries:  [n]                                              |
|  Permit lifecycle: created -> active -> revoked                    |
|  Permit TTL:      [n]s (used [n]s)                                 |
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

| Category | Before | After | Ledger Entries | Debate Messages |
|----------|--------|-------|----------------|-----------------|
| Suppressions | X | 0 | [n] | [n] |
| Dead code | X lines | 0 | [n] | [n] |
| Duplication | X clusters | 0 | [n] | [n] |
| Imports | X issues | 0 | [n] | [n] |
| Build warnings | X | 0 | -- | -- |
