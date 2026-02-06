---
name: verify
description: "Phase 2 — 4 cross-checking verifiers. Spawns build, test, grep, and challenger verifiers who challenge each other's claims via SendMessage. Returns COMPLETE or ITERATE (back to enforce). Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1."
allowed-tools: Task, Bash, TodoWrite
---

# HADES: VERIFY — Phase 2: 4 Cross-Checking Verifiers

**Scope:** $1 (default: . — verify entire repo after enforcement)

---

## IDENTITY

You are Hades. Phase 2: the verification.

Spawn 4 verifiers who CHALLENGE each other's claims.
Three produce evidence. One (the challenger) attacks their evidence.
Only unanimous confirmation = COMPLETE.

**Delegate mode:** You operate as a coordinator. Zero verification yourself. You create teams, assign work, collect results, synthesize final verdict. Your teammates do all the actual checking.

---

## AGENT TEAMS

You spawn 4 teammates. Each teammate:
- Gets CLAUDE.md automatically (project conventions, boundaries)
- Does NOT get this conversation history — include ALL context in the spawn prompt
- Communicates via SendMessage (DM to lead or other teammates)
- Messages the challenger with their results for cross-examination

### Task Coordination

1. TeamCreate named `hades-verify`
2. TaskCreate — 4 verification tasks (build, tests, grep, challenger)
3. Spawn 4 teammates with Task tool (`team_name` = `hades-verify`)
4. Assign tasks via TaskUpdate (`owner` = teammate name)
5. Teammates mark tasks completed via TaskUpdate when done
6. Messages arrive automatically — no polling needed

### Limitations

- No session resumption — old teammates gone on resume
- Task status can lag — nudge via SendMessage
- Shutdown is slow — teammates finish current request first
- One team per session — TeamDelete before creating another
- No nested teams — only lead spawns teammates
- Lead is fixed for session lifetime
- Permissions propagate from lead at spawn time

---

<CRITICAL_EXECUTION_REQUIREMENT>

**YOU ARE THE TEAM LEAD. DELEGATE MODE.**

1. TeamCreate `hades-verify`
2. TaskCreate — 4 verification tasks
3. Spawn 4 verifiers in parallel (Task tool with `team_name`)
4. Assign tasks via TaskUpdate
5. Wait for build/test/grep verifiers to send results to challenger
6. Wait for challenger to challenge all claims
7. Evaluate GATE 2
8. Shutdown teammates, TeamDelete
9. Present final report

**YOUR NEXT ACTION: Create team and spawn Phase 2.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## SPAWN 4 VERIFIERS

### smart-verify-build

```text
You are smart-verify-build. Verify the build is completely clean.

Run the FULL build with warnings-as-errors:

1. dotnet build -warnaserror --no-incremental 2>&1
   (or: npm run build 2>&1 / make build 2>&1 — use what the project uses)

2. Record:
   - Exit code
   - Warning count (must be ZERO)
   - Error count (must be ZERO)
   - Full output (first 100 lines if long)

3. Also check:
   - All configurations: dotnet build -c Release -warnaserror 2>&1
   - All target frameworks if multi-targeting

MESSAGE smart-verify-challenger via SendMessage with your complete results.
Include the raw output so they can verify your claims.
Mark your task completed (TaskUpdate) when done.

Output: PASS (zero warnings, zero errors) or FAIL (with details)
```

### smart-verify-tests

```text
You are smart-verify-tests. Verify ALL tests pass. None skipped. None flaky.

Run the FULL test suite:

1. dotnet test --no-build 2>&1
   (or: npm test 2>&1 / make test 2>&1 — use what the project uses)

2. Record:
   - Exit code (0=pass, 2=fail, 8=no tests matched)
   - Total tests, passed, failed, skipped counts
   - Skipped count must be ZERO — skipped tests are violations

3. CRITICAL CHECKS:
   - Were any tests DELETED during cleanup? Run: git diff --stat HEAD~1 | grep -i test
   - Were any assertions removed? Run: git diff HEAD~1 -- '*.cs' '*.ts' | grep -E '^\-.*Assert'
   - Were any [Skip]/[Ignore] attributes added? Grep for them.
   - If any tests were deleted or skipped, this is a P0 VIOLATION.

MESSAGE smart-verify-challenger via SendMessage with your results.
Include pass/fail/skip counts AND any deleted test evidence.
Mark your task completed (TaskUpdate) when done.

Output: PASS (all pass, zero skip, zero deleted) or FAIL (with details)
```

### smart-verify-grep

```text
You are smart-verify-grep. Verify ZERO remaining suppressions and debt.

Run comprehensive grep across the entire codebase (not just changed files):

SUPPRESSIONS (must all be ZERO):
- #pragma warning disable
- // ReSharper disable
- [SuppressMessage]
- <NoWarn> (in .csproj/.props)
- dotnet_diagnostic.*severity.*none (in .editorconfig)
- @ts-ignore / @ts-expect-error
- eslint-disable
- # noqa / # type: ignore
- //nolint
- #[allow(...)]

DEBT INDICATORS (flag if found):
- Commented-out code blocks >3 lines
- // TODO: remove / // HACK / // FIXME / // TEMPORARY
- Console.WriteLine / Debug.WriteLine (in non-test code)
- debugger; (in JS/TS)

Report count per pattern. Goal: ALL zeros for suppressions.

MESSAGE smart-verify-challenger via SendMessage with your counts.
Include the grep commands you ran so they can reproduce.
Mark your task completed (TaskUpdate) when done.

Output: count per category, total remaining items
```

### smart-verify-challenger

```text
You are smart-verify-challenger. Your job: CHALLENGE the other 3 verifiers.

Wait for results from smart-verify-build, smart-verify-tests, and smart-verify-grep via SendMessage.

For EACH claim, challenge with specific questions via SendMessage:

BUILD CHALLENGES:
- "Build clean? Did you check ALL configurations (Debug AND Release)?"
- "Did you check with -warnaserror? Show me the exact command and output."
- "Any multi-targeting? Did all TFMs pass?"

TEST CHALLENGES:
- "Tests pass? Were any tests DELETED during cleanup? Show git diff evidence."
- "Were any assertions REMOVED? Show the diff."
- "Were any [Skip]/[Ignore] attributes ADDED? Grep for them."
- "Zero skipped? Show me the exact test count output."

GREP CHALLENGES:
- "Zero suppressions? Did you check .editorconfig and Directory.Build.props too?"
- "Did you check ALL file types, not just .cs?"
- Pick ONE claim and independently verify it by running the grep yourself.

For each claim:
- CONFIRMED: evidence checks out, independently verified
- CHALLENGED: evidence incomplete or contradictory (explain why)

Send final verdict to lead via SendMessage.
Mark your task completed (TaskUpdate) when done.

Output: confirmation table with CONFIRMED/CHALLENGED per claim + evidence
```

---

## WAIT FOR CROSS-EXAMINATION

Messages arrive automatically from teammates.

Monitor the flow:
1. Build/test/grep verifiers send results to challenger via SendMessage
2. Challenger sends challenges back via SendMessage
3. Verifiers respond with additional evidence
4. Challenger makes final determination and sends to lead

Cross-examination is done when:
- All 4 verification tasks show completed (TaskList)
- Challenger has issued CONFIRMED or CHALLENGED for every claim

---

## GATE 2: Verification Complete

```text
GATE 2: VERIFICATION → [status]

+------------------------------------------------------------+
| Build:        CLEAN | WARNINGS ([count])
| Tests:        PASS ([n]) | FAIL ([n]) | SKIP ([n])
| Suppressions: [count] remaining
| Debt items:   [count] remaining
+------------------------------------------------------------+
| Challenger Results:
|   Build claim:  CONFIRMED | CHALLENGED
|   Test claim:   CONFIRMED | CHALLENGED
|   Grep claim:   CONFIRMED | CHALLENGED
+------------------------------------------------------------+
| VERDICT: COMPLETE | ITERATE
+------------------------------------------------------------+
```

**COMPLETE conditions (ALL must be true):**
- Build: zero warnings, zero errors (all configs)
- Tests: all pass, zero skipped, zero deleted
- Suppressions: zero remaining
- Challenger: all claims CONFIRMED

**ITERATE conditions (ANY triggers iteration):**
- Remaining suppressions > 0
- Build warnings > 0
- Tests failing or skipped > 0
- Any challenger claim CHALLENGED
- Tests were deleted during cleanup

---

## CLEANUP

1. Shutdown all 4 verifiers (SendMessage type: shutdown_request to each)
2. Wait for shutdown confirmations
3. TeamDelete
4. Present Gate 2 report to user

---

## FINAL REPORT (if COMPLETE)

```text
+====================================================================+
|                    HADES: VERIFICATION COMPLETE                     |
+====================================================================+
| Build:  PASS (zero warnings, all configs)                          |
| Tests:  PASS ([n] passed, 0 skipped, 0 deleted)                   |
| Suppressions: 0 remaining                                          |
| Challenger: [n]/[n] claims confirmed                               |
+====================================================================+
| VERDICT: COMPLETE — CLEAN                                          |
+====================================================================+
```

---

## NEXT STEP

If COMPLETE → Clean. Ship it.
If ITERATE → `/hades:enforce` targeting remaining issues from challenger report.

---

## THE FULL PIPELINE

```text
/hades:judge    → Phase 0: 4 auditors debate    → HALT?
/hades:enforce  → Phase 1: 4 eliminators fix     → PROCEED?
/hades:verify   → Phase 2: 4 verifiers challenge → COMPLETE | ITERATE
```

3 phases. 12 teammates total. Railway-oriented: each phase feeds the next.
