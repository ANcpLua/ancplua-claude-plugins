# Phase 1: Elimination — Teammate Prompt Templates

Shut down all Phase 0 teammates (SendMessage type="shutdown_request" to each, wait for shutdown_responses).
Spawn 4 new teammates via Task tool with `team_name="hades-cleanup"`.
Each claims tasks from the shared task list created during Phase 0.

**Teammate context (include in every spawn prompt):**
You are a teammate in the `hades-cleanup` team. Use SendMessage to communicate with other teammates and the lead.
Use TaskList to see available tasks. Use TaskUpdate to claim and complete tasks.
When you receive a SendMessage with type `shutdown_request` from the lead, approve it with SendMessage type: `shutdown_response`.

**File Ownership Protocol (CRITICAL — prevents overwrites):**

Before spawning eliminators, map files to owners:

1. Read all tasks from Phase 0 audit (TaskList)
2. Map each task to its file(s)
3. Group files by primary domain:
   - Files with suppressions -> smart-elim-suppressions
   - Files with dead code only -> smart-elim-deadcode
   - Files in duplication clusters -> smart-elim-duplication
   - Files with import issues only -> smart-elim-imports
4. If a file has issues from multiple domains -> assign to the domain with MORE issues
5. List ownership explicitly in each eliminator's spawn prompt

Plan approval: mandatory for structural changes (extracting utilities, moving code).
Optional for trivial fixes (single-line replacements). Teammates use SendMessage (recipient: lead)
to send plan, wait for approval via SendMessage, then implement.

Iteration 2+: lead shuts down all eliminators (SendMessage type="shutdown_request" to each),
waits for shutdown_responses, then spawns fresh eliminators targeting remaining violations.

**Every eliminator MUST log deletions to the ledger:**

```bash
plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "delete" "<path>" "<reason>" "<agent-name>" "$(git rev-parse HEAD)"
```

## smart-elim-suppressions

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
> Use SendMessage (recipient: lead) when blocked on a file owned by another teammate.
> Use SendMessage (recipient: "smart-elim-deadcode") if fixing a suppression reveals dead code.
> Use TaskUpdate to mark tasks complete as you go. Goal: ZERO suppressions.

## smart-elim-deadcode

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
> Use SendMessage (recipient: "smart-elim-duplication") if deletion reveals new duplication.
> Use TaskUpdate to mark tasks complete as you go.

## smart-elim-duplication

> You are smart-elim-duplication. Consolidate ALL duplication from Phase 0 audit.
> SESSION: SMART_ID=[insert Smart ID]
>
> Claim duplication tasks from shared list. For each cluster:
>
> - Extract shared utility, unify implementations, replace local with shared
> - Tighten access modifiers (public -> internal if single assembly)
>
> **MANDATORY:** After each consolidation, log to ledger:
> `plugins/exodia/scripts/smart/ledger.sh append "$SMART_ID" "consolidate-dup" "<files>" "<reason>" "smart-elim-duplication"`
>
> Build after every consolidation. If build breaks, fix immediately.
> Use SendMessage (recipient: "smart-elim-imports") if consolidation changes import structure.
> Use TaskUpdate to mark tasks complete as you go.

## smart-elim-imports

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
> Use SendMessage (recipient: lead) when import changes affect files owned by other teammates.
> Use TaskUpdate to mark tasks complete as you go.

**Lead instruction:** Monitor task completion via TaskList. Resolve file ownership conflicts
via SendMessage. When all tasks done, evaluate Gate 1.
