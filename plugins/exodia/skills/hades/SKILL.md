---
name: hades
description: "This skill should be used when the user asks to clean up dead code, remove suppressions/warnings, fix duplication or imports, verify the build is clean with zero suppressions, run a frontend design audit (--goggles), or make a public-API brutal break (--guillotine). Smart infra: deletion permit, audit ledger, break manifest. 4 teammates per phase. Use when cleanup/scope/intensity, goggles, or guillotine is requested."
argument-hint: "[scope] [focus] [intensity] [--goggles] [--guillotine]"
allowed-tools: Task, Bash, TodoWrite, TeamCreate, TeamDelete, TaskCreate, TaskList, TaskUpdate, SendMessage
effort: xhigh
hooks:
  PreToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: prompt
          prompt: |
            You are Ralph, the behavior enforcer for a Hades cleanup session.
            The LEAD agent is trying to use a tool. Context:
            $ARGUMENTS

            The lead's ONLY job is orchestrating — spawning teammates,
            evaluating gates, messaging teammates. The lead NEVER writes
            code, edits files, or fixes issues directly.

            Exception: writing to .eight-gates/ or .smart/ directories
            (infrastructure files like findings.json, checkpoints, ledger)
            is allowed — that's bookkeeping, not implementation.

            If the lead is editing/writing code files, BLOCK it.
            If the lead is writing infrastructure files, ALLOW it.
          model: haiku
          timeout: 10
  Stop:
    - hooks:
        - type: prompt
          prompt: |
            You are Ralph. The Hades lead agent wants to stop.
            Context:
            $ARGUMENTS

            Check: Are all gate criteria met? Did all teammates finish
            and get shut down? Is the deletion permit revoked? Is the
            ledger complete? If anything is incomplete, BLOCK and explain
            what's missing.
          model: haiku
          timeout: 15
  SubagentStop:
    - hooks:
        - type: prompt
          prompt: |
            You are Ralph. A Hades teammate wants to stop.
            Context:
            $ARGUMENTS

            Check: Did this teammate complete its assigned tasks?
            Did it report findings or log deletions? Teammates that
            quit without delivering results should be BLOCKED.
          model: haiku
          timeout: 10
  TeammateIdle:
    - hooks:
        - type: command
          command: "bash ${CLAUDE_PLUGIN_ROOT}/scripts/smart/check-hades-idle.sh"
          timeout: 10
          statusMessage: "Verifying ledger entries before idle..."
---

# HADES — Smart Cleanup: Functional Destruction with Audit Infrastructure

> Same input -> same output. Every phase is a pure transformation.
> Every gate is a pure predicate: state -> PROCEED | HALT.
> Every deletion is permitted, logged, and auditable.

**Scope:** $0 (default: . — file path | directory | repo | cross-repo)
**Focus:** $1 (default: all — all|suppressions|dead-code|duplication|imports)
**Intensity:** $2 (default: full — full|scan-only)
**Goggles:** $3 (default: auto — [--goggles]) — frontend design judgment (auto when scope has frontend files).
**Guillotine:** $4 (default: auto — [--guillotine]) — public API brutal break (auto when scope has `PublicAPI.Shipped.txt`, an `<IsPackable>true</IsPackable>` csproj, or `packages/`).

**Smart Infrastructure:** `${CLAUDE_PLUGIN_ROOT}/scripts/smart/` — layout + ID/ledger/permit/manifest schemas in [references/team-architecture.md](references/team-architecture.md).

**Hookify guards (optional):** `cp ${CLAUDE_PLUGIN_ROOT}/scripts/smart/hookify-rules/*.local.md .`
(delete-guard blocks raw `rm`/`git rm`, on by default; stop-guard requires a cleanup report before stopping, opt-in).

**Teammate prompt templates** (full prompts in [templates/](templates/)): `auditors.md` (Phase 0),
`eliminators.md` (Phase 1), `verifiers.md` (Phase 2), `goggles.md` (--goggles), `guillotine.md` (--guillotine).

---

## IDENTITY

Hades is destruction. Functional. Idempotent. Rule-bound. Auditable.

Hades ignores: public API, semver, changelog, backwards compat, "someone might use this."
Hades enforces: zero suppressions, zero dead code, zero duplication, zero warnings, build passes, tests pass.
Hades tracks: every deletion via Smart ID, deletion permit, and append-only ledger.
Hades follows the rules — else we can't play games.

**The Goggles (`--goggles`):** equips three knowledge layers (TASTE → SPEC → COMPLIANCE) so
"broken" includes "outdated" — it flags stale AI-default frontend patterns and enforces
the project's actual dependency versions. +3 goggles teammates in Phase 0. Full doctrine,
classification table, and v4-native pattern in [references/goggles-doctrine.md](references/goggles-doctrine.md).

**The Guillotine (`--guillotine`):** inverts the default identity — Hades actively destroys
public API, forbids compat artifacts, and demands functional equivalence per removed symbol.
+1 teammate per phase, with two-axis verification (shim-free + functionally equivalent) and a
required break-manifest. Full protocol in [references/guillotine-doctrine.md](references/guillotine-doctrine.md).

---

## TEAM ARCHITECTURE

Three phases, 4 teammates each (+3 goggles in Phase 0 when equipped, +1 guillotine per phase
when equipped), shut down before each phase transition:

```text
Phase 0: AUDIT        → smart-audit-{suppressions,deadcode,duplication,imports} → GATE 0
Phase 1: ELIMINATION  → smart-elim-{suppressions,deadcode,duplication,imports}  → GATE 1
Phase 2: VERIFICATION → smart-verify-{build,tests,grep,challenger}              → GATE 2
```

Teammates debate via SendMessage; each owns disjoint files; all spawn as Opus 4.8 (`model: opus`).
Full diagram (including goggles/guillotine lanes), concurrency rules, smart-targeting, and the
Smart Infrastructure layout + schemas: [references/team-architecture.md](references/team-architecture.md).

---

<CRITICAL_EXECUTION_REQUIREMENT>

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, read `.eight-gates/artifacts/findings.json`.
Filter findings where `category` matches focus (`DEAD`, `DUP`, `SUPP`, `IMP`, or all).
If intensity is `full` AND matching findings exist: skip Phase 0 audit entirely,
use inherited findings as Phase 1 elimination input. Log: "Inherited [n] findings from prior scan."
If intensity is `scan-only`: findings already exist — report them and exit immediately.

**YOU ARE THE TEAM LEAD. DELEGATE MODE.**

**STEP 0 — Smart Infrastructure Init (before any teammates):**

```bash
# Generate session Smart ID
SMART_ID="$(${CLAUDE_PLUGIN_ROOT}/scripts/smart/smart-id.sh generate)"

# Initialize ledger
${CLAUDE_PLUGIN_ROOT}/scripts/smart/ledger.sh init

# Create deletion permit for scope (auto-revoked at cleanup)
${CLAUDE_PLUGIN_ROOT}/scripts/smart/permit.sh create "$SMART_ID" "$0" --ttl=3600
```

Store `$SMART_ID` — pass it to every teammate prompt.

**STEP 0b — Determine Scope + Smart Target:**

```bash
# Staged + unstaged changes
git diff --cached --name-only
git diff --name-only

# If nothing changed, check last commit
git diff HEAD~1 --name-only

# If $0 is a path, scope to that path
```

Produce a file list and store it:

```bash
FILE_LIST=$(git diff --cached --name-only; git diff --name-only)
[ -z "$FILE_LIST" ] && FILE_LIST=$(git diff HEAD~1 --name-only)
```

This goes into EVERY teammate's prompt.

**Smart Target (auto-equip goggles + guillotine):** run the detection script over
`$FILE_LIST` — equip goggles when scope contains frontend files (`.tsx/.jsx/.css/.html/.svelte/.vue`)
or `--goggles` is passed; equip the guillotine (and `break-manifest.sh init`) when scope crosses a
public-API surface (`PublicAPI.Shipped.txt`, a packable `.csproj`, or a `packages/` path) or
`--guillotine` is passed. Full detection bash in [references/team-architecture.md](references/team-architecture.md) § "Smart Target auto-detection". Hades knows when he needs his glasses — and his guillotine.

**STEP 1 — Create Team:**

```text
TeamCreate: team_name = "hades-cleanup", description = "Hades cleanup: [scope]"
```

You are the team lead. You orchestrate — you NEVER implement. Teammates do all code work.

**STEP 2 — Create Phase 0 Tasks:** one TaskCreate per audit domain into the shared
`hades-cleanup` task list — `Audit {suppressions,dead code,duplication,imports} in [scope]`.
If GOGGLES equipped, add goggles tasks (taste, spec, compliance). If GUILLOTINE equipped,
add a guillotine audit task (public-API surface classification).

**STEP 3 — Spawn Phase 0 Teammates (ALL in ONE message):** Task tool, `team_name="hades-cleanup"`,
`subagent_type="general-purpose"`, `model="opus"`, one per domain — `smart-audit-{suppressions,deadcode,duplication,imports}`.
Prompts from [templates/auditors.md](templates/auditors.md).

If GOGGLES: +3 goggles teammates from [templates/goggles.md](templates/goggles.md) (all Opus 4.8, same team_name).
If GUILLOTINE: +1 teammate `smart-guillotine-audit` from [templates/guillotine.md](templates/guillotine.md) (Opus 4.8, same team_name).

Teammates debate findings via SendMessage and share the task list via TaskCreate/TaskUpdate.
Messages are delivered automatically — do not poll.

**STEP 4 — Evaluate GATE 0:** when debate converges (teammates idle, no new messages),
review findings via TaskList and apply the GATE 0 verdict ([references/gates-and-reports.md](references/gates-and-reports.md)).

**STEP 5 — Phase Transition (Phase 0 → Phase 1):** shut down each Phase 0 teammate
(`SendMessage type="shutdown_request"`, plus goggles/guillotine if equipped); wait for all
`shutdown_response`s. Spawn 4 Phase 1 eliminators from [templates/eliminators.md](templates/eliminators.md)
(same Task pattern). Goggles findings become elimination tasks. If GUILLOTINE: also spawn
`smart-guillotine-elim` ([templates/guillotine.md](templates/guillotine.md)) — it deletes/downgrades symbols and emits one `break-manifest.jsonl` entry per BREAK task.

**STEP 6 — Evaluate GATE 1:** when all elimination tasks complete (TaskList), apply the GATE 1 verdict.

**STEP 7 — Phase Transition (Phase 1 → Phase 2):** shut down Phase 1 teammates, wait for
`shutdown_response`s, spawn 4 Phase 2 verifiers from [templates/verifiers.md](templates/verifiers.md).
`smart-verify-grep` also confirms goggles violations were resolved. If GUILLOTINE: also spawn
`smart-guillotine-verify` ([templates/guillotine.md](templates/guillotine.md)) — two-axis verification (shim-free + functionally equivalent) against `.smart/break-manifest.jsonl`, then `break-manifest.sh validate`.

**STEP 8 — Evaluate GATE 2:** COMPLETE → cleanup. ITERATE → shut down verifiers, respawn eliminators on remaining items.

**STEP 9 — Cleanup (after COMPLETE):**

```bash
# Revoke deletion permit
${CLAUDE_PLUGIN_ROOT}/scripts/smart/permit.sh revoke

# Show ledger summary
${CLAUDE_PLUGIN_ROOT}/scripts/smart/ledger.sh count
```

Shut down all remaining teammates (SendMessage type="shutdown_request").
Wait for all shutdown_responses, then delete the team:

```text
TeamDelete: team_name = "hades-cleanup"
```

**YOUR NEXT ACTION: Run Step -1 check, then Step 0 (Smart Init), then Step 1 (TeamCreate) and spawn Phase 0.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## GATES, CLEANUP & FINAL REPORT

Verdict logic (full status boxes, ITERATE triggers, cleanup sequence, connector hooks, and the
HADES CLEANUP REPORT in **[references/gates-and-reports.md](references/gates-and-reports.md)**):

- **GATE 0:** `scan-only` → SCAN_COMPLETE; zero findings → HALT; findings → PROCEED.
- **GATE 1:** build/tests fail or missing break-manifest entry → HALT; all complete + green → PROCEED.
- **GATE 2:** any remaining suppression/warning, incomplete ledger, unresolved challenge, or guillotine axis fail → ITERATE; all clean → COMPLETE.

After COMPLETE: revoke permit, (if guillotine) validate break-manifest, shut down teammates, `TeamDelete`, present the report.
