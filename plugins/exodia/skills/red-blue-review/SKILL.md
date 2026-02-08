---
name: red-blue-review
description: "IF adversarial security/quality review needed THEN use this. Red team attacks, Blue team defends, Red re-attacks. Scored. Release recommendation. For broad audit → mega-swarm."
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
├─ Phase 2: BLUE DEFENSE (1 agent per valid finding)
│  └── blue-defender-N (one per RED finding)
│  └── GATE → fixes collected
│
├─ Phase 3: RED RE-ATTACK (1 agent per fix)
│  └── red-reattacker-N (one per BLUE fix)
│  └── VERDICT: DEFEATED / BYPASSED / INCOMPLETE
│
└─ RELEASE: SAFE / BLOCK
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**THIS IS AN ADVERSARIAL EXERCISE.**

1. Launch 3 Red Team agents in ONE message
2. Validate findings (reject false positives)
3. Launch 1 Blue defender per valid finding
4. Launch 1 Red re-attacker per Blue fix
5. Score and generate release recommendation

**YOUR NEXT MESSAGE: 3 Red Team Task tool calls. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: RED ATTACK — 3 Agents

Launch ALL 3 in ONE message.

### red-crash-hunter

> subagent: deep-debugger | model: opus
>
> RED TEAM — Crash Hunter. TARGET: $0 | SCOPE: $1
>
> Find ways to CRASH the code:
> Null refs, invalid input, resource exhaustion, circular refs, race conditions, exception gaps, loop edge cases, overflow.
>
> Per crash: reproduction code, expected vs actual, severity (Critical/High/Medium).
> Format: CRASH-001: [title] | Severity | Reproduction | Location
>
> Real bugs only — false alarms cost -5 points.

### red-security-attacker

> subagent: feature-dev:code-reviewer | model: opus
>
> RED TEAM — Security Attacker. TARGET: $0 | SCOPE: $1
>
> Find SECURITY vulnerabilities:
> Injection (SQL/command/code), path traversal, data exposure,
> unsafe deserialization, missing validation, hardcoded secrets, SSRF/CSRF.
>
> Per vuln: malicious input, vulnerable code path, exploitation method, impact.
> Format: SEC-001: [title] | Severity | Attack Input | Exploitation | Impact
>
> Proof of concept required. Theoretical issues = 0 points.

### red-api-breaker

> subagent: feature-dev:code-explorer
>
> RED TEAM — API Breaker. TARGET: $0 | SCOPE: $1
>
> Find ways to BREAK the API contract:
> Behavior != docs, edge cases, missing validation, bypass restrictions,
> inconsistencies, breaking changes, null/empty handling, async violations.
>
> Per break: documented vs actual behavior, proof code, consumer impact.
> Format: BREAK-001: [title] | Severity | Documented | Actual | Proof
>
> Real contract violations only, not style preferences.

---

## GATE: Red Findings Validation

```text
RED TEAM FINDINGS:
+------------------------------------------------------------+
| RED-1 Crash Hunter:     [findings] — VALID/INVALID each   |
| RED-2 Security Attacker: [findings] — VALID/INVALID each  |
| RED-3 API Breaker:      [findings] — VALID/INVALID each   |
+------------------------------------------------------------+
| Valid: [count] | Rejected: [count] | Red Score: [points]   |
+------------------------------------------------------------+
```

---

## PHASE 2: BLUE DEFENSE

Launch ONE defender per valid Red finding:

### blue-defender-N (one per finding)

> subagent: feature-dev:code-architect | model: opus
>
> BLUE TEAM — Defend against: [PASTE RED FINDING]
>
> 1. Verify: Is finding real?
> 2. Analyze: Why does this exist?
> 3. Fix: Design a fix
> 4. Protect: No regressions
> 5. Test: Write test case
>
> Output: Finding valid? Root cause. Proposed fix code. Regression check. Test case.
> If INVALID, explain why with evidence.

---

## PHASE 3: RED RE-ATTACK

Launch ONE re-attacker per Blue fix:

### red-reattacker-N (one per fix)

> subagent: deep-debugger
>
> RED RE-ATTACK — Try to bypass: [PASTE BLUE FIX]
>
> 1. Bypass the fix
> 2. Find edge cases it misses
> 3. Check for regressions
> 4. Verify root cause addressed
>
> VERDICT (choose one):
> **DEFEATED** — Fix holds. Blue +5 pts.
> **BYPASSED** — Found way around. Red +3, Blue -3. Show bypass method.
> **INCOMPLETE** — Partially works. List gaps.

---

## FINAL REPORT

```text
+====================================================================+
|              RED vs BLUE RESULTS                                    |
+====================================================================+
| Red Team:  [X] points                                               |
| Blue Team: [Y] points                                               |
| Winner: [RED/BLUE] TEAM                                             |
+--------------------------------------------------------------------+
| Critical: [found]/[fixed] | High: [found]/[fixed]                   |
| Medium: [found]/[fixed]                                             |
+--------------------------------------------------------------------+
| RELEASE: [ ] SAFE — all critical/high fixed                         |
|          [ ] BLOCK — outstanding critical issues                     |
+====================================================================+
```

| ID | Category | Severity | Status | Points |
|----|----------|----------|--------|--------|
| CRASH-001 | Crash | Critical | Fixed/Open | +10 |
| SEC-001 | Security | High | Fixed/Bypassed | +5/-3 |

**Outstanding Issues:** [any open critical/high — MUST fix before release]
