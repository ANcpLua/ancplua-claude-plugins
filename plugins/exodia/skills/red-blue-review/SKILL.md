---
name: red-blue-review
description: "IF need adversarial security/quality review THEN use this (3 Red attackers + N Blue defenders + verification). IF standard code review THEN fix pipeline. IF pre-release security validation THEN this. IF found security issues in mega-swarm THEN this. Attacks: crashes, security vulns, API contract violations. Use BEFORE production deployments."
allowed-tools: Task, Bash, TodoWrite
---

# RED TEAM / BLUE TEAM ADVERSARIAL REVIEW

**Target:** $1 (default: staged changes)
**Scope:** $2 (default: full, options: full|security|api|performance)

---

## OVERVIEW

An adversarial security/quality review pattern where:
- **Red Team** (3 agents): Actively tries to BREAK the code
- **Blue Team** (1 agent per finding): Defends and proposes fixes
- **Verification**: Red re-attacks to validate fixes

```
+-------------------------------------------------------------+
|                 ADVERSARIAL REVIEW FLOW                     |
+-------------------------------------------------------------+
|  Phase 1: RED TEAM ATTACK (3 parallel agents)               |
|           |                                                 |
|  Phase 2: BLUE TEAM DEFENSE (1 per finding)                 |
|           |                                                 |
|  Phase 3: RED RE-ATTACK (verification)                      |
|           |                                                 |
|  RELEASE RECOMMENDATION: SAFE / BLOCK                       |
+-------------------------------------------------------------+
```

---

## SCORING SYSTEM

| Event | Red Points | Blue Points |
|-------|-----------|-------------|
| Valid critical finding | +10 | - |
| Valid high finding | +5 | - |
| Valid medium finding | +2 | - |
| Invalid/false finding | -5 | - |
| Fix verified (no bypass) | - | +5 |
| Fix bypassed | +3 | -3 |
| Test case accepted | - | +2 |

---

## EXECUTION INSTRUCTIONS

<CRITICAL_EXECUTION_REQUIREMENT>
**THIS IS AN ADVERSARIAL EXERCISE.**

1. Phase 1: Launch ALL 3 Red Team agents in ONE message
2. Collect and validate findings
3. Phase 2: Launch ONE Blue Team defender per valid finding
4. Phase 3: Red re-attacks each fix
5. Generate release recommendation

**YOUR NEXT MESSAGE: Launch 3 Red Team Task tool calls. NOTHING ELSE.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: RED TEAM ATTACK (3 Parallel Agents)

Launch ALL Red Team agents in ONE message:

### RED-1: Crash Hunter
```yaml
subagent_type: deep-debugger
model: opus
description: "Red Team: Hunt crashes"
prompt: |
  RED TEAM AGENT - Crash Hunter

  TARGET: [insert $1 here, default: staged changes]
  SCOPE: [insert $2 here, default: full]

  YOUR MISSION: Find ways to CRASH the code.

  ## Attack Vectors
  1. Null reference paths
  2. Invalid input handling
  3. Resource exhaustion
  4. Circular references
  5. Race conditions
  6. Exception handling gaps
  7. Edge cases in loops
  8. Integer overflow/underflow

  ## For Each Crash Found
  - Minimal reproduction code
  - Expected vs actual behavior
  - Severity assessment (Critical/High/Medium)

  ## Output Format
  ### CRASH-001: [Title]
  **Severity:** Critical/High/Medium
  **Reproduction:** [Code or steps to trigger]
  **Expected:** [What should happen]
  **Actual:** [What does happen]
  **Location:** [file:line]

  Find as many crashes as possible. Each crash = points for Red Team.
  Be AGGRESSIVE. Real bugs only - false alarms cost you -5 points.
```

### RED-2: Security Attacker
```yaml
subagent_type: feature-dev:code-reviewer
model: opus
description: "Red Team: Hunt security vulns"
prompt: |
  RED TEAM AGENT - Security Attacker

  TARGET: [insert $1 here, default: staged changes]
  SCOPE: [insert $2 here, default: full]

  YOUR MISSION: Find SECURITY vulnerabilities.

  ## Attack Vectors
  1. Injection vulnerabilities (SQL, command, code)
  2. Path traversal
  3. Sensitive data exposure
  4. Unsafe deserialization
  5. Missing input validation
  6. Hardcoded secrets/credentials
  7. Insecure string operations
  8. SSRF/CSRF opportunities

  ## Proof of Concept Required
  For each vulnerability, show:
  1. Malicious input
  2. Vulnerable code path
  3. Exploitation method
  4. Impact assessment

  ## Output Format
  ### SEC-001: [Vulnerability Title]
  **Severity:** Critical/High/Medium
  **Attack Input:** [Malicious payload]
  **Vulnerable Code:** [file:line with vulnerable code]
  **Exploitation:** [How an attacker exploits this]
  **Impact:** [What damage is possible]

  Real exploits only. Theoretical issues without proof = 0 points.
  False security alarms = -5 points. Be certain.
```

### RED-3: API Breaker
```yaml
subagent_type: feature-dev:code-explorer
description: "Red Team: Break API contracts"
prompt: |
  RED TEAM AGENT - API Breaker

  TARGET: [insert $1 here, default: staged changes]
  SCOPE: [insert $2 here, default: full]

  YOUR MISSION: Find ways to BREAK the public API contract.

  ## Attack Vectors
  1. Behavior differs from documentation
  2. Edge cases with unexpected behavior
  3. Missing validation allowing invalid state
  4. Ways to bypass intended restrictions
  5. Inconsistencies between similar APIs
  6. Breaking changes from previous versions
  7. Null/empty handling inconsistencies
  8. Threading/async contract violations

  ## For Each Break Found
  - Code demonstrating the break
  - Expected vs actual behavior
  - Impact on consumers

  ## Output Format
  ### BREAK-001: [Title]
  **Severity:** Critical/High/Medium
  **Documented Behavior:** [What the API claims to do]
  **Actual Behavior:** [What it actually does]
  **Proof:** [Code demonstrating the break]
  **Consumer Impact:** [How this affects API users]

  Focus on REAL contract violations, not style preferences.
```

**-> WAIT for all 3 Red Team agents, validate findings, then proceed to Phase 2.**

---

## GATE: Red Team Findings Validation

Before Phase 2, validate each finding:

```
RED TEAM FINDINGS:
+------------------------------------------------------------+
| RED-1 (Crash Hunter):                                      |
|   - CRASH-001: [title] - VALID/INVALID                     |
|                                                            |
| RED-2 (Security Attacker):                                 |
|   - SEC-001: [title] - VALID/INVALID                       |
|                                                            |
| RED-3 (API Breaker):                                       |
|   - BREAK-001: [title] - VALID/INVALID                     |
+------------------------------------------------------------+
| VALID FINDINGS: [count]                                    |
| INVALID (rejected): [count]                                |
| RED TEAM SCORE: [points]                                   |
+------------------------------------------------------------+
```

---

## PHASE 2: BLUE TEAM DEFENSE

For EACH valid Red Team finding, launch ONE Blue Team defender:

### BLUE-N Template (One per finding)
```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Blue Team: Defend [RED-ID]"
prompt: |
  BLUE TEAM AGENT - Defender

  You must defend against this Red Team finding:

  [PASTE THE SPECIFIC RED TEAM FINDING HERE]

  ## Your Mission
  1. **Verify**: Is the finding real? (not a false alarm)
  2. **Analyze**: Why does this vulnerability/bug exist?
  3. **Fix**: Design a fix that resolves the issue
  4. **Protect**: Ensure fix doesn't introduce regressions
  5. **Test**: Write test case that would catch this

  ## Output Format
  ### Defense for [RED-ID]

  **Finding Valid:** Yes/No/Partial

  **Root Cause:** [Why this vulnerability/bug exists]

  **Proposed Fix:** [Code showing the fix]

  **Regression Check:**
  - [x] Existing tests still pass
  - [x] New test covers this case
  - [x] No performance impact

  **Test Case:** [Test code that proves fix works]

  If finding is INVALID, explain why with evidence.
```

**-> Collect all Blue Team fixes, then proceed to Phase 3.**

---

## PHASE 3: RED RE-ATTACK (Verification)

For EACH Blue Team fix, Red Team attempts to bypass:

### RED Re-Attack Template
```yaml
subagent_type: deep-debugger
description: "Red Re-Attack: [BLUE-ID]"
prompt: |
  RED TEAM - Re-Attack

  Blue Team proposed this fix for [RED-ID]:

  [PASTE BLUE TEAM FIX HERE]

  ## Your Mission
  1. Try to BYPASS the fix
  2. Find edge cases the fix misses
  3. Check for regressions introduced by fix
  4. Verify fix actually addresses root cause

  ## Output - Choose ONE:

  **DEFEATED** - Fix works, cannot bypass
  The fix successfully addresses [RED-ID].
  - Tested: [what you tried]
  - Result: Fix holds
  - Blue Team awarded +5 points

  **BYPASSED** - Found way around fix
  The fix can be bypassed:
  - Bypass method: [how to circumvent]
  - Proof: [code/steps]
  - Red Team awarded +3 points, Blue Team -3

  **INCOMPLETE** - Fix partially works
  Fix addresses main case but misses:
  - Gap 1: [what's missing]
  - Gap 2: [what's missing]
  - Recommendation: [what Blue needs to add]
```

---

## FINAL REPORT

After all phases complete:

```
+====================================================================+
|              RED TEAM vs BLUE TEAM RESULTS                          |
+====================================================================+
|                         SCOREBOARD                                  |
|  Red Team:  [X] points                                              |
|  Blue Team: [Y] points                                              |
|  Winner: [RED/BLUE] TEAM                                            |
+====================================================================+
|                    FINDINGS SUMMARY                                 |
|  Critical: [count] found, [count] fixed                             |
|  High:     [count] found, [count] fixed                             |
|  Medium:   [count] found, [count] fixed                             |
+====================================================================+
|                 RELEASE RECOMMENDATION                              |
|  [ ] SAFE TO RELEASE - All critical/high fixed                      |
|  [ ] BLOCK RELEASE - Outstanding critical issues                    |
+====================================================================+
```

### All Findings

| ID | Category | Severity | Status | Points |
|----|----------|----------|--------|--------|
| CRASH-001 | Crash | Critical | Fixed/Open | +10 |
| SEC-001 | Security | High | Fixed/Bypassed | +5/-3 |
| BREAK-001 | API | Medium | Disputed | 0 |

### Outstanding Issues

[Any issues still open after all rounds - MUST be fixed before release if Critical/High]

### Lessons Learned

[Patterns that should be prevented in future code]
