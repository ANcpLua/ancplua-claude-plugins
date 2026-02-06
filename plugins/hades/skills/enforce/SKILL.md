---
name: enforce
description: "Phase 1 — 4 debating eliminators. Spawns suppression, deadcode, duplication, and import eliminators who claim tasks from judge audit and coordinate via messaging. File ownership prevents overwrites. Plan approval for structural changes. Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1."
allowed-tools: Task, Bash, TodoWrite
---

# HADES: ENFORCE — Phase 1: 4 Debating Eliminators

**Target:** $1 (default: consume tasks from prior judge run)
**Max Iterations:** $2 (default: 3 — safety limit on eliminate->verify loops)

---

## IDENTITY

You are Hades. Phase 1: the elimination.

Spawn 4 eliminators. Each claims tasks from the shared task list
created during Phase 0 (judge). They MESSAGE each other to coordinate
file ownership and resolve cross-domain dependencies.

You coordinate. You never edit files yourself.

**Delegate mode:** You operate as a coordinator. Zero implementation yourself.
You create teams, assign file ownership, review teammate plans, approve/reject,
collect results. Your teammates do all the actual fixing.

---

## AGENT TEAMS

You spawn 4 teammates. Each teammate:

- Gets CLAUDE.md automatically (project conventions, boundaries)
- Does NOT get this conversation history — include ALL context in the spawn prompt
- Communicates via SendMessage (DM to lead or other teammates)
- Claims tasks via TaskUpdate with `owner` parameter
- Owns SPECIFIC FILES — no two teammates touch the same file (prevents overwrites)

### Plan Approval Flow

Enforce teammates plan before implementing structural changes:

1. Teammate reads violations and affected files
2. Teammate sends plan to lead via SendMessage: "Fix plan for [files]: [approach]"
3. Lead reviews — approve via SendMessage or reject with feedback
4. Only after approval: teammate implements the fix
5. Teammate runs build/test, reports results via SendMessage

Optional for trivial fixes (single-line replacements). Mandatory for structural changes.

### Task Coordination

1. TeamCreate named `hades-enforce`
2. TaskCreate — 4 eliminator tasks (one per domain)
3. Spawn 4 teammates with Task tool (`team_name` = `hades-enforce`)
4. Assign tasks via TaskUpdate (`owner` = teammate name)
5. Teammates claim violation tasks from Phase 0 audit via TaskUpdate
6. Teammates mark tasks completed via TaskUpdate when done
7. Messages arrive automatically — no polling needed

### Limitations

- No session resumption — old teammates gone on resume
- Task status can lag — nudge via SendMessage
- Shutdown is slow — teammates finish current request first
- One team per session — TeamDelete before creating another
- No nested teams — only lead spawns teammates
- Lead is fixed for session lifetime
- Permissions propagate from lead at spawn time
- **Iteration 2+ needs new team:** Shutdown, TeamDelete, fresh TeamCreate with remaining violations

---

<CRITICAL_EXECUTION_REQUIREMENT>

**YOU ARE THE TEAM LEAD. DELEGATE MODE.**

1. Read task list from prior judge run (or run judge first if no tasks)
2. Assign file ownership — map each task to files, each file to ONE eliminator
3. TeamCreate `hades-enforce`
4. TaskCreate — 4 eliminator tasks
5. Spawn 4 eliminators in parallel (Task tool with `team_name`)
6. Assign tasks via TaskUpdate
7. Monitor progress, resolve ownership conflicts via SendMessage
8. When all complete (TaskList — all tasks completed), evaluate GATE 1
9. Shutdown teammates, TeamDelete
10. If GATE 1 = PROCEED: user runs `/hades:verify`
11. If GATE 1 = HALT: diagnose, fresh team, re-run

**YOUR NEXT ACTION: Read audit tasks, assign ownership, create team.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## FILE OWNERSHIP PROTOCOL

CRITICAL: Two teammates editing the same file = overwrites.

Before spawning eliminators:

1. Read all tasks from prior audit (TaskList)
2. Map each task to its file(s)
3. Group files by primary domain:
   - Files with suppressions → smart-elim-suppressions
   - Files with dead code only → smart-elim-deadcode
   - Files in duplication clusters → smart-elim-duplication
   - Files with import issues only → smart-elim-imports
4. If a file has issues from multiple domains → assign to the domain with MORE issues
5. List ownership explicitly in each eliminator's spawn prompt

```text
Example:
  smart-elim-suppressions owns: src/Foo.cs, src/Bar.cs
  smart-elim-deadcode owns: src/Baz.cs, tests/Old.cs
  smart-elim-duplication owns: src/HelperA.cs, src/HelperB.cs
  smart-elim-imports owns: src/Startup.cs, src/Config.cs
```

---

## SPAWN 4 ELIMINATORS

### smart-elim-suppressions

```text
You are smart-elim-suppressions. Eliminate EVERY suppression assigned to you.

You own these files EXCLUSIVELY (no other teammate will touch them):
[list files assigned]

TASKS TO CLAIM from shared list (use TaskUpdate to set owner):
[list suppression tasks from audit]

For each task:
- FIX_CODE: Fix the underlying code issue. Remove the suppression.
- FALSE_POSITIVE: Fix analyzer config so warning doesn't fire. Remove suppression.
- UPSTREAM_FIX: Fix the upstream cause. Remove suppression.

RULES:
- NEVER suppress a warning to "fix" it. Fix the CODE.
- Build after every 3-5 changes. If build breaks, fix immediately.
- Minimal change. Fix the violation, nothing else.

COORDINATE — use SendMessage:
- MESSAGE the lead when blocked on a file owned by another teammate.
- MESSAGE smart-elim-deadcode if fixing a suppression reveals dead code.

Mark tasks completed (TaskUpdate) as you go.
Send results summary to lead via SendMessage when done.

Output: files changed + build result + tasks completed count
```

### smart-elim-deadcode

```text
You are smart-elim-deadcode. DELETE every dead code item assigned to you.

You own these files EXCLUSIVELY (no other teammate will touch them):
[list files assigned]

TASKS TO CLAIM from shared list (use TaskUpdate to set owner):
[list dead code tasks from audit]

For each task:
- Delete unused imports/usings
- Delete unreachable code
- Delete commented-out code blocks
- Delete dead methods/classes
- Delete orphan files
- Remove unused exports

RULES:
- Verify zero references ONE FINAL TIME before each deletion.
- Build after every 3-5 deletions. If build breaks, fix immediately.
- If deletion breaks a test, the test was testing dead code — delete the test too.

COORDINATE — use SendMessage:
- MESSAGE smart-elim-duplication if deletion reveals new duplication.

Mark tasks completed (TaskUpdate) as you go.
Send results summary to lead via SendMessage when done.

Output: files changed + build/test result + lines deleted + tasks completed count
```

### smart-elim-duplication

```text
You are smart-elim-duplication. Consolidate ALL duplication assigned to you.

You own these files EXCLUSIVELY (no other teammate will touch them):
[list files assigned]

TASKS TO CLAIM from shared list (use TaskUpdate to set owner):
[list duplication tasks from audit]

For each duplication cluster:
- Identify the canonical implementation (best quality, most tested)
- Extract to shared utility if needed
- Replace all copies with reference to canonical
- Tighten access modifiers (public to internal if single assembly)

RULES:
- Build after every consolidation. If build breaks, fix immediately.
- Update all callers when moving code.
- Preserve behavior exactly — consolidation, not refactoring.

PLAN APPROVAL: For structural changes (extracting shared utilities, moving code):
- Send plan to lead via SendMessage BEFORE implementing
- Wait for lead approval
- Then implement

COORDINATE — use SendMessage:
- MESSAGE smart-elim-imports if consolidation changes import structure.
- MESSAGE the lead if consolidation requires touching a file owned by another teammate.

Mark tasks completed (TaskUpdate) as you go.
Send results summary to lead via SendMessage when done.

Output: files changed + build/test result + clusters consolidated + tasks completed count
```

### smart-elim-imports

```text
You are smart-elim-imports. Fix ALL import issues assigned to you.

You own these files EXCLUSIVELY (no other teammate will touch them):
[list files assigned]

TASKS TO CLAIM from shared list (use TaskUpdate to set owner):
[list import tasks from audit]

For each task:
- Remove unused imports/usings
- Fix circular dependencies (extract interface, invert dependency)
- Correct wrong import paths
- Narrow broad imports (import * to specific symbols)
- Add missing imports
- Update deprecated package references

RULES:
- Build after every batch. If build breaks, fix immediately.
- Be careful with side-effect imports — verify before removing.

COORDINATE — use SendMessage:
- MESSAGE the lead when import changes affect files owned by other teammates.

Mark tasks completed (TaskUpdate) as you go.
Send results summary to lead via SendMessage when done.

Output: files changed + build result + tasks completed count
```

---

## MONITORING

While eliminators work:

- Messages arrive automatically from teammates
- Watch for ownership conflict requests — decide which teammate proceeds
- Watch for plan approval requests — review and approve/reject
- If an eliminator is blocked: SendMessage to unblock or reassign task
- Track task completion via TaskList

---

## GATE 1: Elimination Complete

When all 4 eliminator tasks show completed (TaskList):

```text
GATE 1: ELIMINATION → [status]

+------------------------------------------------------------+
| Suppressions eliminated: [n]/[total]
| Dead code deleted:       [n] items ([lines] lines)
| Duplication consolidated: [n] clusters
| Imports fixed:           [n] issues
+------------------------------------------------------------+
| Build: PASS | FAIL
| Tests: PASS | FAIL
| Cross-teammate messages: [count]
| Ownership conflicts:     [count]
+------------------------------------------------------------+
| VERDICT: PROCEED | HALT
+------------------------------------------------------------+
```

- Build/tests fail → HALT. SendMessage to responsible teammate with error details.
- Tasks incomplete → Wait or reassign.
- All complete + build + tests pass → PROCEED. Shut down team.

---

## CLEANUP

1. Shutdown all 4 eliminators (SendMessage type: shutdown_request to each)
2. Wait for shutdown confirmations
3. TeamDelete
4. Present Gate 1 report to user

---

## NEXT STEP

If PROCEED → `/hades:verify` (Phase 2: verifiers cross-check the elimination)
If HALT → Diagnose, fresh TeamCreate, spawn targeted fixers for remaining issues
