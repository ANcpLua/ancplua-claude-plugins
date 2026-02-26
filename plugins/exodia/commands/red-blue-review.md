---
description: "IF adversarial security/quality review needed THEN use this. Red team attacks, Blue team defends, Red re-attacks. Scored. Release recommendation. For broad audit -> mega-swarm."
allowed-tools: Task, Bash, TodoWrite
---

# RED BLUE REVIEW — Adversarial Attack/Defense with Scoring

> Red breaks. Blue fixes. Red re-attacks. Points decide.

**Target:** $0 (default: staged changes)
**Scope:** $1 (default: full | full|security|api|performance)

---

## SCORING

| Event | Red | Blue |
|-------|-----|------|
| Valid critical finding | +10 | — |
| Valid high finding | +5 | — |
| Valid medium finding | +2 | — |
| Invalid/false finding | -5 | — |
| Fix verified (no bypass) | — | +5 |
| Fix bypassed by Red | +3 | -3 |
| Test case accepted | — | +2 |

---

## TEAM ARCHITECTURE

```text
REVIEW LEAD (You — Orchestrator)
│
│  TeamCreate: "red-blue-review"
│
├─ Phase 1: RED ATTACK (3 teammates, coordinate via SendMessage)
│  ├── red-crash-hunter ──────┐
│  ├── red-security-attacker ─┼── SendMessage: share attack vectors
│  └── red-api-breaker ───────┘   TaskCreate: each finding → shared list
│  └── GATE → validate findings, shutdown_request → Red
│
├─ Phase 2: BLUE DEFENSE (1 teammate per MODULE)
│  └── blue-defender-N ── TaskUpdate: claim findings, SendMessage: cross-module fixes
│  └── GATE → fixes collected, shutdown_request → Blue
│
├─ Phase 3: RED RE-ATTACK (1 teammate per module)
│  └── red-reattacker-N ── TaskUpdate: DEFEATED/BYPASSED/INCOMPLETE
│  └── shutdown_request → re-attackers
│
├─ RELEASE: SAFE / BLOCK
└─ TeamDelete
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, read `.eight-gates/artifacts/findings.json`.
Inject findings into Red Team prompts as attack surface hints. Do NOT give to Blue — they defend blind.

**THIS IS AN ADVERSARIAL EXERCISE.**

**STEP 0 — Create Team:**
TeamCreate: team_name = "red-blue-review", description = "Adversarial review: $0"

**STEP 1 — Red Attack Phase:**
Spawn 3 Red attackers as teammates (ALL in ONE message):
Task tool: team_name="red-blue-review", name="red-crash-hunter", subagent_type="deep-debugger", model="opus"
Task tool: team_name="red-blue-review", name="red-security-attacker", subagent_type="general-purpose", model="opus"
Task tool: team_name="red-blue-review", name="red-api-breaker", subagent_type="general-purpose", model="opus"

Red attackers use SendMessage to coordinate: "I found SQL injection in handler X, check for XSS too"
Red attackers use TaskCreate for each finding (shared task list).

**STEP 2 — Validate & Transition:**
When Red converges (idle, no new messages): validate findings, reject false positives.
SendMessage type="shutdown_request" to all Red attackers.
Group validated findings by module.

**STEP 3 — Blue Defense Phase:**
Spawn 1 Blue defender per module as teammates:
Task tool: team_name="red-blue-review", name="blue-defender-[module]", subagent_type="general-purpose", model="opus"

Blue defenders claim findings from shared task list via TaskUpdate.
Blue defenders use SendMessage to coordinate fixes across modules.

**STEP 4 — Validate & Transition:**
SendMessage type="shutdown_request" to all Blue defenders.

**STEP 5 — Red Re-Attack Phase:**
Spawn 1 Red re-attacker per module:
Task tool: team_name="red-blue-review", name="red-reattacker-[module]", subagent_type="deep-debugger"

Re-attackers use TaskUpdate to mark findings as DEFEATED/BYPASSED/INCOMPLETE.

**STEP 6 — Score & Cleanup:**
Score results, generate release recommendation.
SendMessage type="shutdown_request" to all re-attackers.
TeamDelete.

**YOUR NEXT MESSAGE: TeamCreate + 3 Red Team Task tool calls. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: RED ATTACK — 3 Agents

Launch ALL 3 in ONE message.

### red-crash-hunter

> teammate: red-crash-hunter | team: red-blue-review | subagent_type: deep-debugger | model: opus
> RED TEAM — Crash Hunter. TARGET: $0 | SCOPE: $1
> You are a teammate in the red-blue-review team.
> Use SendMessage to coordinate with other Red team members (red-security-attacker, red-api-breaker).
> Use TaskCreate for each finding you discover.
> When you receive a shutdown_request, approve it.
> Find ways to CRASH the code: Null refs, invalid input, resource exhaustion, race conditions, overflow.
> Format: CRASH-001: [title] | Severity | Reproduction | Location
> Real bugs only — false alarms cost -5 points.

### red-security-attacker

> teammate: red-security-attacker | team: red-blue-review | subagent_type: general-purpose | model: opus
> RED TEAM — Security Attacker. TARGET: $0 | SCOPE: $1
> You are a teammate in the red-blue-review team.
> Use SendMessage to coordinate with other Red team members (red-crash-hunter, red-api-breaker).
> Use TaskCreate for each finding you discover.
> When you receive a shutdown_request, approve it.
> Find SECURITY vulnerabilities: Injection, path traversal, data exposure, unsafe deserialization, SSRF/CSRF.
> Format: SEC-001: [title] | Severity | Attack Input | Exploitation | Impact
> Proof of concept required. Theoretical issues = 0 points.

### red-api-breaker

> teammate: red-api-breaker | team: red-blue-review | subagent_type: general-purpose | model: opus
> RED TEAM — API Breaker. TARGET: $0 | SCOPE: $1
> You are a teammate in the red-blue-review team.
> Use SendMessage to coordinate with other Red team members (red-crash-hunter, red-security-attacker).
> Use TaskCreate for each finding you discover.
> When you receive a shutdown_request, approve it.
> Find ways to BREAK the API contract: Behavior != docs, edge cases, missing validation, breaking changes.
> Format: BREAK-001: [title] | Severity | Documented | Actual | Proof
> Real contract violations only, not style preferences.

---

## PHASE 2: BLUE DEFENSE

**Before spawning:** Group validated findings by target module/file. One defender per module.

Launch ONE defender per MODULE (not per finding):

### blue-defender-N (one per module)

> teammate: blue-defender-[module] | team: red-blue-review | subagent_type: general-purpose | model: opus
> BLUE TEAM — Defend MODULE: [MODULE_PATH]
> FINDINGS IN THIS MODULE: [PASTE ALL RED FINDINGS FOR THIS MODULE]
> You are a teammate in the red-blue-review team.
> Claim findings from the shared task list using TaskUpdate (set status to "in_progress").
> Use SendMessage to coordinate with other Blue defenders when fixes span modules.
> When you receive a shutdown_request, approve it.
>
> **FILE OWNERSHIP:** You own ONLY files in [MODULE_PATH]. Do not modify files outside your module.
>
> For EACH finding in your module:
>
> 1. Verify: Is finding real?
> 2. Analyze: Why does this exist?
> 3. Fix: Design a fix
> 4. Protect: No regressions
> 5. Test: Write test case
>
> Output: All fixes for your module + test results

---

## PHASE 3: RED RE-ATTACK

Launch ONE re-attacker per Blue module (mirrors Phase 2 grouping):

### red-reattacker-N (one per module)

> teammate: red-reattacker-[module] | team: red-blue-review | subagent_type: deep-debugger | model: opus
> RED RE-ATTACK — Try to bypass ALL fixes in MODULE: [MODULE_PATH]
> BLUE FIXES: [PASTE ALL BLUE FIXES FOR THIS MODULE]
> You are a teammate in the red-blue-review team.
> Use TaskUpdate to mark each finding as DEFEATED/BYPASSED/INCOMPLETE.
> Use SendMessage to share bypass techniques with other re-attackers.
> When you receive a shutdown_request, approve it.
>
> For EACH fix: VERDICT: **DEFEATED** (Blue +5) | **BYPASSED** (Red +3, Blue -3) | **INCOMPLETE** (list gaps)

---

## FINAL REPORT

```text
+====================================================================+
|              RED vs BLUE RESULTS                                    |
+====================================================================+
| Red Team:  [X] points | Blue Team: [Y] points                      |
| Winner: [RED/BLUE] TEAM                                             |
+--------------------------------------------------------------------+
| RELEASE: [ ] SAFE — all critical/high fixed                         |
|          [ ] BLOCK — outstanding critical issues                     |
+====================================================================+
```
