---
name: hades
description: "IF cleanup/elimination needed THEN use this. IF zero suppressions THEN this. IF dead code THEN this. IF duplication THEN this. Smart-Hades: every session gets a Smart ID, deletion permit, and audit ledger. Team lead skill — spawns 4 debate teammates per phase. Ignores public API, semver, changelog. Pure functional destruction. Idempotent: same input, same output. Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1."
allowed-tools: Task, Bash, TodoWrite
---

# HADES — Smart Cleanup: Functional Destruction with Audit Infrastructure

> Same input → same output. Every phase is a pure transformation.
> Every gate is a pure predicate: state → PROCEED | HALT.
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
.smart/                          ← gitignored, session-local
├── delete-ledger.jsonl          ← append-only audit log (JSONL)
└── delete-permit.json           ← active deletion permit (TTL-based)

plugins/exodia/scripts/smart/    ← checked-in tooling
├── smart-id.sh                  ← SMART-YYYY-MM-DD-<timestamp><random>
├── ledger.sh                    ← init | append | query | count
├── permit.sh                    ← create | validate | revoke | show
└── hookify-rules/
    ├── hookify.smart-hades-delete-guard.local.md   ← blocks raw rm/git rm
    └── hookify.smart-hades-stop-guard.local.md     ← opt-in completion guard
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
├─ Phase 0: AUDIT (4 Debating Auditors)
│  ├── smart-audit-suppressions
│  ├── smart-audit-deadcode
│  ├── smart-audit-duplication
│  └── smart-audit-imports
│  │   ↕ debate via messaging ↕
│  └── GATE 0 → PROCEED | HALT | SCAN_COMPLETE
│
├─ Phase 1: ELIMINATION (4 Debating Eliminators)
│  ├── smart-elim-suppressions
│  ├── smart-elim-deadcode
│  ├── smart-elim-duplication
│  └── smart-elim-imports
│  │   ↕ coordinate via messaging ↕
│  │   ↕ log every deletion to ledger ↕
│  └── GATE 1 → PROCEED | HALT
│
└─ Phase 2: VERIFICATION (4 Cross-Checking Verifiers)
   ├── smart-verify-build
   ├── smart-verify-tests
   ├── smart-verify-grep
   └── smart-verify-challenger
       ↕ challenge each other's claims ↕
       ↕ verify ledger completeness ↕
   └── GATE 2 → COMPLETE | ITERATE (back to Phase 1)
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
3. Spawn Phase 0 (4 auditors), require plan approval before they start
4. Wait for debate to converge, evaluate GATE 0
5. Shut down Phase 0 teammates, spawn Phase 1 (4 eliminators)
6. Wait for elimination, evaluate GATE 1
7. Shut down Phase 1 teammates, spawn Phase 2 (4 verifiers)
8. If GATE 2 = ITERATE, repeat Phase 1. If COMPLETE, clean up team.

**STEP 9 — Cleanup (after COMPLETE):**

```bash
# Revoke deletion permit
plugins/exodia/scripts/smart/permit.sh revoke

# Show ledger summary
plugins/exodia/scripts/smart/ledger.sh count
```

**Fallback:** If Agent Teams unavailable, use Task tool with
`subagent_type: general-purpose`, `model: opus`, 4 agents per phase.

**YOUR NEXT ACTION: Run Step 0 (Smart Init), then create team and spawn Phase 0.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 0: AUDIT — 4 Debating Auditors

Spawn 4 teammates. Each scans the full scope but through their lens.
They MESSAGE each other to challenge findings before finalizing.

**Pass Smart ID to all auditors:** Include `SMART_ID=[value]` in each teammate prompt.

### smart-audit-suppressions

> You are smart-audit-suppressions. Find EVERY warning suppression in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $1]
>
> Patterns: `#pragma warning disable`, `// ReSharper disable`,
> `[SuppressMessage]`, `<NoWarn>`, `dotnet_diagnostic severity=none`,
> `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `# noqa`,
> `# type: ignore`, `//nolint`, `#[allow(...)]`
>
> For each: git blame (why added), is warning valid, is it false positive.
>
> MESSAGE smart-audit-deadcode when you find suppressions on potentially dead code.
> MESSAGE smart-audit-duplication when you find identical suppressions across files.
> CHALLENGE other auditors: "Is this really needed? I can fix the underlying code."
>
> Create tasks in shared list. Verdict per item: FIX_CODE | FALSE_POSITIVE | UPSTREAM_FIX

### smart-audit-deadcode

> You are smart-audit-deadcode. Find ALL dead code in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $1]
>
> Find: unused imports, unreachable code, commented blocks >3 lines,
> dead methods/classes (zero references), orphan files, unused exports.
>
> Verify ZERO references (grep entire codebase) before marking dead.
>
> MESSAGE smart-audit-suppressions when dead code has suppressions (they own the suppression, you own the deletion).
> MESSAGE smart-audit-duplication when dead code is a duplicate of live code.
> CHALLENGE other auditors: "Are you sure nothing calls this? I found a reflection reference."
>
> Create tasks in shared list with file:line and confidence level.

### smart-audit-duplication

> You are smart-audit-duplication. Find ALL duplication in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $1]
>
> Find: copy-pasted code, similar implementations to unify,
> repeated patterns, local reimplementations of shared library helpers.
>
> MESSAGE smart-audit-deadcode when one copy is unused (they handle deletion).
> MESSAGE smart-audit-imports when duplication exists because of wrong import paths.
> CHALLENGE other auditors: "These look similar but serve different edge cases — really duplicates?"
>
> Create tasks in shared list with duplication clusters.

### smart-audit-imports

> You are smart-audit-imports. Find ALL import/dependency issues in scope.
> SESSION: SMART_ID=[insert Smart ID]
>
> SCOPE: [insert $1]
>
> Find: unused imports, circular dependencies, wrong import paths,
> overly broad imports (import \* when only one symbol used),
> missing imports that cause runtime failures, deprecated package refs.
>
> MESSAGE smart-audit-deadcode when imports point to dead modules.
> MESSAGE smart-audit-duplication when import issues cause local reimplementation.
> CHALLENGE other auditors: "This import looks unused but it's a side-effect import — don't remove."
>
> Create tasks in shared list with file:line.

**Lead instruction:** Wait for all 4 to finish debating. When messaging stops and tasks are created, evaluate Gate 0.

---

## GATE 0: Audit Complete

```text
GATE 0: AUDIT → [status]
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

- $3 = scan-only → SCAN_COMPLETE. Present report. Revoke permit. Shut down. Done.
- Zero findings → HALT. Nothing to clean. Revoke permit. Shut down. Done.
- Findings exist → PROCEED. Shut down Phase 0. Spawn Phase 1.

---

## PHASE 1: ELIMINATION — 4 Debating Eliminators

Shut down all Phase 0 teammates. Spawn 4 new teammates.
Each claims tasks from the shared list created during Phase 0.

**File Ownership Protocol (CRITICAL — prevents overwrites):**

Before spawning eliminators, map files to owners:

1. Read all tasks from Phase 0 audit (TaskList)
2. Map each task to its file(s)
3. Group files by primary domain:
   - Files with suppressions → smart-elim-suppressions
   - Files with dead code only → smart-elim-deadcode
   - Files in duplication clusters → smart-elim-duplication
   - Files with import issues only → smart-elim-imports
4. If a file has issues from multiple domains → assign to the domain with MORE issues
5. List ownership explicitly in each eliminator's spawn prompt

Plan approval: mandatory for structural changes (extracting utilities, moving code).
Optional for trivial fixes (single-line replacements). Teammates send plan to lead,
wait for approval, then implement.

Iteration 2+: shutdown, TeamDelete, fresh TeamCreate with remaining violations.

**Every eliminator MUST log deletions to the ledger:**

```bash
plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "delete" "<path>" "<reason>" "<agent-name>" "$(git rev-parse HEAD)"
```

### smart-elim-suppressions

> You are smart-elim-suppressions. Eliminate EVERY suppression from Phase 0 audit.
> SESSION: SMART_ID=[insert Smart ID]
>
> Claim suppression tasks from shared list. For each:
>
> - FIX_CODE: Fix underlying code. Remove suppression.
> - FALSE_POSITIVE: Fix analyzer config. Remove suppression.
> - UPSTREAM_FIX: Fix upstream, publish, update downstream. Remove suppression.
>
> **MANDATORY:** After each deletion, log to ledger:
> `plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "remove-suppression" "<file:line>" "<reason>" "smart-elim-suppressions"`
>
> Build after every 3-5 changes. If build breaks, fix immediately.
> MESSAGE the lead when blocked on a file owned by another teammate.
> MESSAGE smart-elim-deadcode if fixing a suppression reveals dead code.
> Mark tasks complete as you go. Goal: ZERO suppressions.

### smart-elim-deadcode

> You are smart-elim-deadcode. DELETE every dead code item from Phase 0 audit.
> SESSION: SMART_ID=[insert Smart ID]
>
> Claim dead code tasks from shared list. For each:
>
> - Remove unused imports, delete unreachable code, delete commented blocks
> - Delete dead methods/classes, delete orphan files, remove unused exports
>
> **MANDATORY:** After each deletion, log to ledger:
> `plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "delete-dead-code" "<file:line>" "<reason>" "smart-elim-deadcode"`
>
> Verify zero references one final time before each deletion.
> Build after every 3-5 deletions. If build breaks, fix immediately.
> MESSAGE smart-elim-duplication if deletion reveals new duplication.
> Mark tasks complete as you go.

### smart-elim-duplication

> You are smart-elim-duplication. Consolidate ALL duplication from Phase 0 audit.
> SESSION: SMART_ID=[insert Smart ID]
>
> Claim duplication tasks from shared list. For each cluster:
>
> - Extract shared utility, unify implementations, replace local with shared
> - Tighten access modifiers (public → internal if single assembly)
>
> **MANDATORY:** After each consolidation, log to ledger:
> `plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "consolidate-dup" "<files>" "<reason>" "smart-elim-duplication"`
>
> Build after every consolidation. If build breaks, fix immediately.
> MESSAGE smart-elim-imports if consolidation changes import structure.
> Mark tasks complete as you go.

### smart-elim-imports

> You are smart-elim-imports. Fix ALL import issues from Phase 0 audit.
> SESSION: SMART_ID=[insert Smart ID]
>
> Claim import tasks from shared list. For each:
>
> - Remove unused imports, fix circular dependencies, correct import paths
> - Narrow broad imports, add missing imports, update deprecated references
>
> **MANDATORY:** After each fix, log to ledger:
> `plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "fix-import" "<file:line>" "<reason>" "smart-elim-imports"`
>
> Build after every batch. If build breaks, fix immediately.
> MESSAGE the lead when import changes affect files owned by other teammates.
> Mark tasks complete as you go.

**Lead instruction:** Monitor task completion. Resolve file ownership conflicts. When all tasks done, evaluate Gate 1.

---

## GATE 1: Elimination Complete

```text
GATE 1: ELIMINATION → [status]
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

- Build/tests fail → HALT. Lead diagnoses. Spawn targeted fix teammate.
- Tasks incomplete → Wait or reassign.
- All complete + build + tests pass → PROCEED. Shut down Phase 1. Spawn Phase 2.

---

## PHASE 2: VERIFICATION — 4 Cross-Checking Verifiers

Shut down Phase 1 teammates. Spawn 4 verifiers who CHALLENGE each other.

### smart-verify-build

> You are smart-verify-build. Verify the build is clean with warnings-as-errors.
> SESSION: SMART_ID=[insert Smart ID]
>
> Run: `dotnet build -warnaserror 2>&1` or `npm run build 2>&1` or `make build 2>&1`
>
> Report: zero warnings, zero errors, clean build.
> MESSAGE smart-verify-challenger with your results so they can challenge them.

### smart-verify-tests

> You are smart-verify-tests. Verify all tests pass. No skipped. No flaky.
> SESSION: SMART_ID=[insert Smart ID]
>
> Run: `dotnet test 2>&1` or `npm test 2>&1` or `make test 2>&1`
>
> Report: pass count, fail count, skip count.
> If any test was DELETED or SKIPPED during cleanup, flag it.
> MESSAGE smart-verify-challenger with your results.

### smart-verify-grep

> You are smart-verify-grep. Verify ZERO remaining suppressions/dead code AND ledger completeness.
> SESSION: SMART_ID=[insert Smart ID]
>
> Run comprehensive grep:
>
> - Suppressions: `#pragma warning disable`, `<NoWarn>`, `@ts-ignore`,
>   `eslint-disable`, `# noqa`, `//nolint`, `#[allow]`
> - Dead indicators: commented-out code blocks >3 lines,
>   `// TODO: remove`, `// HACK`
>
> **Also verify ledger completeness:**
> `plugins/exodia/scripts/smart/ledger.sh count` — must match total eliminations.
>
> Report: count per category. Goal: all zeros + ledger complete.
> MESSAGE smart-verify-challenger with your counts.

### smart-verify-challenger

> You are smart-verify-challenger. Your job: CHALLENGE the other 3 verifiers.
> SESSION: SMART_ID=[insert Smart ID]
>
> Wait for results from smart-verify-build, smart-verify-tests, and smart-verify-grep.
>
> For each claim, CHALLENGE:
>
> - "Build clean? Did you check ALL configurations, not just Debug?"
> - "Tests pass? Were any tests deleted during cleanup?
>   Run `git diff --stat` to check."
> - "Zero suppressions? Did you check .editorconfig and
>   Directory.Build.props too?"
> - "Ledger complete? Does entry count match the number of changes
>   in `git diff --stat`?"
>
> Pick ONE claim and independently verify it by running the command yourself.
>
> Report: confirmed claims, challenged claims with evidence.

**Lead instruction:** When challenger has finished challenging, synthesize results for Gate 2.

---

## GATE 2: Verification Complete

```text
GATE 2: VERIFICATION → [status]
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

- Any remaining suppressions > 0 → ITERATE. Back to Phase 1 targeting remaining items.
- Build warnings > 0 → ITERATE.
- Ledger incomplete → ITERATE. Log missing entries.
- Challenged claims unresolved → ITERATE with targeted teammates.
- All zeros + all confirmed + ledger complete → COMPLETE.

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
