---
description: "IF maximum disciplined orchestration needed THEN use this. 8 progressive gates, checkpointing, Hakai guarantee. Composes mega-swarm (MAP), existing fix pipelines (EXECUTE), and hades (HAKAI). Not max chaos — max discipline."
allowed-tools: Task, Bash, TodoWrite
argument-hint: "[objective] [scope] [gate-limit]"
---

# EIGHT GATES — Progressive Discipline Orchestration

> The hero is not the one who creates the biggest explosion.
> The hero is the one who gives everything — slowly, cleanly, honestly.
> Gate 8 means: no step without checkpoint, no checkpoint without hashes, no hash without mini-test.

**Objective:** $0
**Scope:** $1 (default: . — file path | directory | repo)
**Gate Limit:** $2 (default: 8 | 1-8 — progressive, open gates up to this level)

---

## INFRASTRUCTURE

```text
.eight-gates/                     <- gitignored, session-local
├── session.json                  <- TTL-based session state
├── checkpoints.jsonl             <- gate completion log (append-only)
├── decisions.jsonl               <- decision log (why X, why not Y)
├── artifacts/                    <- cached expensive computations
│   ├── scope.txt                 <- file inventory
│   ├── dependencies.txt          <- dependency graph
│   └── findings.json             <- merged findings from MAP phase

plugins/exodia/scripts/smart/     <- checked-in tooling
├── checkpoint.sh                 <- save | load | verify | list
└── session-state.sh              <- create | validate | artifact | decision
```

---

## THE EIGHT GATES

```text
Gate 1: 開門 KAIMON (Opening)     → SCOPE         — Define boundaries
Gate 2: 休門 KYŪMON (Healing)     → CONTEXT        — Load passive context (Yin)
Gate 3: 生門 SEIMON (Life)        → MAP            — Parallel research agents (Yang)
Gate 4: 傷門 SHŌMON (Pain)       → CHECKPOINT     — State snapshot, idempotent
Gate 5: 杜門 TOMON  (Limit)       → REFLECT        — 1 bounded reflection per finding
Gate 6: 景門 KEIMON (View)        → REDUCE         — Merge findings, create work queue
Gate 7: 驚門 KYŌMON (Wonder)     → EXECUTE         — TDD implementation with persistence
Gate 8: 死門 SHIMON (Death)       → HAKAI          — Final verification, irreversible cleanup
```

Each gate has: Entry Condition | Actions | Exit (PROCEED/HALT)

---

<CRITICAL_EXECUTION_REQUIREMENT>

**INIT — Smart Infrastructure (before any gate):**

```bash
# Generate session ID (reuses Hades smart infra)
SESSION_ID="$(plugins/exodia/scripts/smart/smart-id.sh generate)"

# Initialize session state with TTL
plugins/exodia/scripts/smart/session-state.sh create "$SESSION_ID" 7200

# Initialize checkpoint log
plugins/exodia/scripts/smart/checkpoint.sh init "$SESSION_ID"

# Initialize ledger (shared with Hades)
plugins/exodia/scripts/smart/ledger.sh init
```

Store `$SESSION_ID`. Pass it to every agent prompt.

**PROGRESSIVE EXECUTION:**
Open gates 1 through $2 (default: all 8). Each gate evaluates before proceeding.
If any gate HALTs, stop. Fix the issue. Resume from that gate (idempotent).

**RESUME PROTOCOL:**

```bash
# Check what's already done
plugins/exodia/scripts/smart/checkpoint.sh list
# Verify session is still valid
plugins/exodia/scripts/smart/session-state.sh validate
# Skip completed gates, resume from first incomplete
```

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, `.eight-gates/artifacts/findings.json` already
has prior scan data. Skip Gate 3 MAP entirely — load findings from file, proceed directly to Gate 4 CHECKPOINT.
This saves the most expensive phase (4-12 agents) when findings already exist from a prior session.

**YOUR NEXT ACTION: Run Step -1 check, then INIT, then open Gate 1.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## GATE 1: 開門 KAIMON — SCOPE

**Entry:** Session initialized.

1. Define boundaries — what's IN, what's OUT:

   ```bash
   # Inventory all files in scope
   find "$1" -type f | grep -v node_modules | grep -v .git > .eight-gates/artifacts/scope.txt
   wc -l < .eight-gates/artifacts/scope.txt
   ```

2. Identify constraints (language, framework, conventions)
3. Estimate total work (S/M/L/XL) and agent count: S=4, M=8, L=12, XL=12+multi-round

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 1 "scope-defined" \
  "files=$(wc -l < .eight-gates/artifacts/scope.txt)" \
  "estimate=[S|M|L|XL]" "agents=[4|8|12]"
```

**Exit:** Scope document exists. PROCEED if scope is clear. HALT if ambiguous — ask user.

---

## GATE 2: 休門 KYŪMON — CONTEXT (Yin)

**Entry:** Gate 1 PROCEED.

1. Load passive context: CLAUDE.md, relevant skills, specs, ADRs
2. Build artifact cache — expensive-to-reconstruct facts:

   ```bash
   plugins/exodia/scripts/smart/session-state.sh artifact add "dependencies" "$(cat ...)"
   plugins/exodia/scripts/smart/session-state.sh artifact add "api-surface" "$(cat ...)"
   ```

3. Verify assumptions (spawn epistemic-checkpoint if needed):
   > subagent: metacognitive-guard:deep-think-partner
   > Verify these assumptions about the codebase: [list from scope].
   > WebSearch for any version/date/status claims. Output: verified facts only.
4. Log decisions:

   ```bash
   plugins/exodia/scripts/smart/session-state.sh decision "chose-approach" "because..."
   ```

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 2 "context-loaded" \
  "artifacts=$(find .eight-gates/artifacts -maxdepth 1 -type f | wc -l)" "assumptions-verified=[n]"
```

**Exit:** Context loaded, assumptions verified. PROCEED. HALT if critical assumption is wrong.

---

## GATE 3: 生門 SEIMON — MAP (Yang Ignition)

**Entry:** Gate 2 PROCEED.
**Agents:** 4-12 (based on Gate 1 estimate). ALL launched in ONE message.

Parallel MAP phase — every independent research angle simultaneously:

> subagent: [varies by objective]
> SESSION: $SESSION_ID | SCOPE: $1 | OBJECTIVE: $0
> Your angle: [specific research question]
> Output format: { findings: [], severity: P0-P3, confidence: % }
> Write findings to stdout. Lead will merge.

Agent selection based on objective type:

| Objective Type | Agents | Source |
|---------------|--------|--------|
| Bug fix | root-cause, impact, code-explorer | fix pipeline |
| Audit | arch, security, perf, test, quality, bug-hunter | mega-swarm |
| Feature | architect, explorer, reviewer | feature-dev |
| Cleanup | suppressions, deadcode, duplication, imports | hades |
| Custom | up to 12 relevant agents | lead decides |

**Launch ALL agents for objective in ONE message. Wait for completion.**

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 3 "map-complete" \
  "agents-launched=[n]" "agents-completed=[n]" "findings=[n]"
```

**Exit:** >=80% agents complete. PROCEED. <80% → report partial, offer retry.

---

## GATE 4: 傷門 SHŌMON — CHECKPOINT (Senzu Bean)

**Entry:** Gate 3 PROCEED.

The pain gate. Cost of persistence. This is where state becomes durable.

1. **State Snapshot** — compress everything into resumable form:

   ```bash
   plugins/exodia/scripts/smart/session-state.sh artifact add "findings" \
     "$(cat merged-findings.json)"
   ```

2. **Decision Log** — why X, why not Y for every major choice:

   ```bash
   plugins/exodia/scripts/smart/session-state.sh decision "prioritized-P0-over-P2" \
     "P0 blocks deployment, P2 is cosmetic"
   ```

3. **Idempotent Guards** — mark each finding with hash so re-runs skip done work

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 4 "checkpoint-complete" \
  "artifacts-cached=[n]" "decisions-logged=[n]"
```

**Exit:** Always PROCEED (bookkeeping can't fail).

---

## GATE 5: 杜門 TOMON — REFLECT (Ralph Loop)

**Entry:** Gate 4 PROCEED.

**One reflection. Three questions. Cut if it wants more.**

> subagent: metacognitive-guard:deep-think-partner
> SESSION: $SESSION_ID | FINDINGS: [from Gate 3/4 artifacts]
>
> For each P0/P1 finding, answer ONLY these 3 questions:
>
> 1. What is PROBABLY WRONG with this finding?
> 2. Which ASSUMPTION is the riskiest?
> 3. What MINI-TEST would validate it fastest?
>
> DO NOT philosophize. DO NOT expand scope. 3 answers per finding. Done.

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 5 "reflection-complete" \
  "findings-validated=[n]" "assumptions-challenged=[n]" "tests-proposed=[n]"
```

**Exit:** Reflection complete. PROCEED. Never HALT here — reflection informs, doesn't block.

---

## GATE 6: 景門 KEIMON — REDUCE (Full View)

**Entry:** Gate 5 PROCEED.

See the full picture. One agent merges all findings into a roadmap.

1. **Merge** all findings (MAP + REFLECT) into consistent work queue
2. **Prioritize** by: severity, confidence, effort, dependencies
3. **Assign file ownership** — one agent per file, no overlaps
4. **Create implementation plan** with ordered tasks

```text
WORK QUEUE (ordered):
1. [P0] Fix X in file A (owner: agent-1) — depends on: nothing
2. [P0] Fix Y in file B (owner: agent-2) — depends on: nothing
3. [P1] Refactor Z in file C (owner: agent-3) — depends on: #1
...
```

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 6 "reduce-complete" \
  "work-items=[n]" "lanes=[n]" "estimated-agents=[n]"
```

**Exit:** Work queue exists with clear ownership. PROCEED. HALT if conflicts unresolvable.

---

## GATE 7: 驚門 KYŌMON — EXECUTE (Making It Real)

**Entry:** Gate 6 PROCEED.

Implementation phase. TDD. Parallel lanes where possible.

**Lane execution (LAW 3):**

1. Group work items with no dependencies → Lane 1 (parallel)
2. Launch all Lane 1 agents simultaneously
3. When Lane 1 completes, launch Lane 2 (items that depended on Lane 1)
4. Repeat until all lanes complete

Each agent follows TDD:

> 1. Write failing test → 2. Minimal fix → 3. Verify pass → 4. Refactor

**Mini-checkpoints after each lane:**

```bash
plugins/exodia/scripts/smart/checkpoint.sh save 7 "lane-[n]-complete" \
  "items-done=[n]/[total]" "tests-passing=[n]" "build=[PASS|FAIL]"
```

**Multi-round:** If context fills during execution, create session handoff:

```bash
plugins/exodia/scripts/smart/session-state.sh artifact add "handoff" \
  "$(cat .eight-gates/checkpoints.jsonl)"
```

Resume in new session from last checkpoint.

**Exit:** All lanes complete + build passes + tests pass → PROCEED. Build/test fail → HALT, diagnose.

---

## GATE 8: 死門 SHIMON — HAKAI (Night Guy)

**Entry:** Gate 7 PROCEED. Build passes. Tests pass. This is the LAST gate. No return.

**The Death Gate. What survives, ships. What doesn't, Hakai.**

1. **Final Verification** (direct — no agents):

   ```bash
   # Build
   dotnet build --no-incremental 2>&1 || npm run build 2>&1 || make build 2>&1
   # Test
   dotnet test 2>&1 || npm test 2>&1 || make test 2>&1
   # Lint
   dotnet format --verify-no-changes 2>&1 || npm run lint 2>&1 || make lint 2>&1
   # Repo-specific validation
   ./tooling/scripts/weave-validate.sh 2>&1
   ```

2. **Hakai Cleanup** (if anything remains):
   - Zero suppressions, zero dead code, zero duplication
   - Log every deletion to ledger (shared with Hades infra)
   - Irreversible. No heal. Audit ledger is proof.

3. **Final Checkpoint:**

   ```bash
   plugins/exodia/scripts/smart/checkpoint.sh save 8 "hakai-complete" \
     "total-agents=[n]" "total-gates=[n]" "total-checkpoints=[n]" \
     "build=PASS" "tests=PASS" "suppressions=0"
   ```

4. **Revoke Session:**

   ```bash
   plugins/exodia/scripts/smart/session-state.sh expire
   ```

**Exit:** SHIP or DIE. No middle ground. No "mostly done." Zero or complete.

---

## GATE STATUS TEMPLATE

```text
+====================================================================+
|                    EIGHT GATES STATUS                               |
+====================================================================+
| Session: [SESSION_ID]                                               |
| Objective: $0                                                       |
| Scope: $1                                                           |
| Gate Limit: $2                                                      |
+--------------------------------------------------------------------+
| Gate 1 開門 SCOPE:      [DONE|ACTIVE|PENDING] | agents: 0          |
| Gate 2 休門 CONTEXT:    [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 3 生門 MAP:        [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 4 傷門 CHECKPOINT: [DONE|ACTIVE|PENDING] | agents: 0          |
| Gate 5 杜門 REFLECT:    [DONE|ACTIVE|PENDING] | agents: 1          |
| Gate 6 景門 REDUCE:     [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 7 驚門 EXECUTE:    [DONE|ACTIVE|PENDING] | agents: [n]        |
| Gate 8 死門 HAKAI:      [DONE|ACTIVE|PENDING] | agents: [n]        |
+--------------------------------------------------------------------+
| Total Agents: [n] | Checkpoints: [n] | Decisions: [n]              |
| Session TTL: [remaining]s                                           |
+====================================================================+
| VERDICT: SHIP | HALT at Gate [n] | IN PROGRESS Gate [n]            |
+====================================================================+
```

---

## FINAL REPORT

```text
+====================================================================+
|                    EIGHT GATES — MISSION COMPLETE                   |
+====================================================================+
| Session: [SESSION_ID]                                               |
| Objective: $0                                                       |
| Gates Opened: [n]/8                                                 |
+====================================================================+
|  Gate 1 SCOPE:      [summary]                                      |
|  Gate 2 CONTEXT:    [n] artifacts cached, [n] assumptions verified  |
|  Gate 3 MAP:        [n] agents, [n] findings                       |
|  Gate 4 CHECKPOINT: [n] artifacts, [n] decisions logged             |
|  Gate 5 REFLECT:    [n] validated, [n] challenged                   |
|  Gate 6 REDUCE:     [n] work items, [n] lanes                      |
|  Gate 7 EXECUTE:    [n] items done, [n] tests passing               |
|  Gate 8 HAKAI:      build=PASS tests=PASS suppressions=0           |
+====================================================================+
|  Agents spawned: [n] | Checkpoints: [n] | Decisions: [n]            |
|  SESSION: created [time] | expired [time] | duration [n]s           |
|  LEDGER: [n] entries                                                |
+====================================================================+
```
