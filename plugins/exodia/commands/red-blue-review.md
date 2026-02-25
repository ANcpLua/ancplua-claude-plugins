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
├─ Phase 1: RED ATTACK (3 agents parallel)
│  ├── red-crash-hunter
│  ├── red-security-attacker
│  └── red-api-breaker
│  └── GATE → validate findings
│
├─ Phase 2: BLUE DEFENSE (1 agent per MODULE — grouped findings)
│  └── blue-defender-N (one per affected module, all its findings)
│  └── GATE → fixes collected
│
├─ Phase 3: RED RE-ATTACK (1 agent per module's fixes)
│  └── red-reattacker-N (one per BLUE module)
│  └── VERDICT: DEFEATED / BYPASSED / INCOMPLETE
│
└─ RELEASE: SAFE / BLOCK
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, read `.eight-gates/artifacts/findings.json`.
Inject findings into Red Team prompts as attack surface hints. Do NOT give to Blue — they defend blind.

**THIS IS AN ADVERSARIAL EXERCISE.**

1. Launch 3 Red Team agents in ONE message
2. Validate findings (reject false positives), then GROUP by target module/file
3. Launch 1 Blue defender per MODULE (with all that module's findings)
4. Launch 1 Red re-attacker per Blue module
5. Score and generate release recommendation

**YOUR NEXT MESSAGE: 3 Red Team Task tool calls. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: RED ATTACK — 3 Agents

Launch ALL 3 in ONE message.

### red-crash-hunter

> subagent: deep-debugger | model: opus
> RED TEAM — Crash Hunter. TARGET: $0 | SCOPE: $1
> Find ways to CRASH the code: Null refs, invalid input, resource exhaustion, race conditions, overflow.
> Format: CRASH-001: [title] | Severity | Reproduction | Location
> Real bugs only — false alarms cost -5 points.

### red-security-attacker

> subagent: feature-dev:code-reviewer | model: opus
> RED TEAM — Security Attacker. TARGET: $0 | SCOPE: $1
> Find SECURITY vulnerabilities: Injection, path traversal, data exposure, unsafe deserialization, SSRF/CSRF.
> Format: SEC-001: [title] | Severity | Attack Input | Exploitation | Impact
> Proof of concept required. Theoretical issues = 0 points.

### red-api-breaker

> subagent: feature-dev:code-explorer
> RED TEAM — API Breaker. TARGET: $0 | SCOPE: $1
> Find ways to BREAK the API contract: Behavior != docs, edge cases, missing validation, breaking changes.
> Format: BREAK-001: [title] | Severity | Documented | Actual | Proof
> Real contract violations only, not style preferences.

---

## PHASE 2: BLUE DEFENSE

**Before spawning:** Group validated findings by target module/file. One defender per module.

Launch ONE defender per MODULE (not per finding):

### blue-defender-N (one per module)

> subagent: feature-dev:code-architect | model: opus
> BLUE TEAM — Defend MODULE: [MODULE_PATH]
> FINDINGS IN THIS MODULE: [PASTE ALL RED FINDINGS FOR THIS MODULE]
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

> subagent: deep-debugger
> RED RE-ATTACK — Try to bypass ALL fixes in MODULE: [MODULE_PATH]
> BLUE FIXES: [PASTE ALL BLUE FIXES FOR THIS MODULE]
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
