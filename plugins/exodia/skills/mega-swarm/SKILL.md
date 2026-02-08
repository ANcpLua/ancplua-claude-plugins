---
name: mega-swarm
description: "IF codebase audit or release readiness check THEN use this. 6-12 agents scan in parallel. Full(12), quick(6), focused(8). Feed findings into fix-pipeline."
allowed-tools: Task, TodoWrite
---

# MEGA SWARM — Parallel Codebase Audit

> Maximum coverage. Every angle. One report.

**Scope:** $0 (default: full | full|src|tests|config|security)
**Focus:** $1 (optional focus area)
**Mode:** $2 (default: full | full|quick|focused)
**Quick:** $3 (default: false — same as mode=quick)

---

## TEAM ARCHITECTURE

```text
SWARM LEAD (You — Orchestrator)
│
├─ Full mode (12 agents) ─────────────────────
│  ├── arch-auditor        ├── api-auditor
│  ├── security-auditor    ├── dependency-auditor
│  ├── perf-auditor        ├── config-auditor
│  ├── test-auditor        ├── docs-auditor
│  ├── quality-auditor     ├── consistency-auditor
│  ├── error-auditor       └── bug-hunter
│
├─ Quick mode (6 agents) ─────────────────────
│  ├── arch-auditor    ├── security-auditor
│  ├── perf-auditor    ├── test-auditor
│  ├── quality-auditor └── bug-hunter
│
├─ Focused mode (8 agents) ───────────────────
│  └── $1-related auditors + adjacent concerns
│
└── GATE → >=80% complete → SYNTHESIZE
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**Launch ALL agents for selected mode in ONE message. NOTHING ELSE.**

- Full ($2=full or unspecified): 12 agents
- Quick ($2=quick or $3=true): 6 agents
- Focused ($2=focused): 8 agents relevant to $1

Wait for completion. Synthesize. Report.

**YOUR NEXT MESSAGE: Task tool calls for selected mode. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## AUDITORS

Each scans SCOPE=$0 through its lens. Output: issues with severity P0-P3.

### arch-auditor

> subagent: metacognitive-guard:arch-reviewer | model: opus
>
> AUDIT Architecture. Scope: $0 | Focus: $1
> SOLID violations? Coupling? Scalability? Design issues?
> Output: Issues with P0-P3 severity

### security-auditor

> subagent: feature-dev:code-reviewer
>
> AUDIT Security. Scope: $0 | Focus: $1
> Injection? Auth issues? Secrets exposed? Input validation? OWASP Top 10?
> Output: Issues with severity

### perf-auditor

> subagent: feature-dev:code-explorer
>
> AUDIT Performance. Scope: $0 | Focus: $1
> N+1 queries? Memory leaks? Allocations? Blocking calls? Cache misses?
> Output: Issues with severity

### test-auditor

> subagent: feature-dev:code-reviewer
>
> AUDIT Test Quality. Scope: $0 | Focus: $1
> Coverage gaps? Flaky tests? Missing edge cases? Integration gaps?
> Output: Issues with severity

### quality-auditor

> subagent: feature-dev:code-reviewer
>
> AUDIT Code Quality. Scope: $0 | Focus: $1
> Dead code? Duplication? Cyclomatic complexity? Magic numbers? Naming?
> Output: Issues with severity

### bug-hunter

> subagent: deep-debugger | model: opus
>
> HUNT Active Bugs. Scope: $0 | Focus: $1
> Null refs? Race conditions? Off-by-one? Resource leaks? Logic errors?
> Output: Potential bugs with severity

### error-auditor <- full/focused only

> subagent: deep-debugger
>
> AUDIT Error Handling. Scope: $0 | Focus: $1
> Swallowed exceptions? Missing handlers? Poor messages? Recovery gaps?
> Output: Issues with severity

### api-auditor <- full/focused only

> subagent: feature-dev:code-explorer
>
> AUDIT API Contracts. Scope: $0 | Focus: $1
> Breaking changes? Version compat? Doc accuracy? Response consistency?
> Output: Issues with severity

### dependency-auditor <- full/focused only

> subagent: Explore
>
> AUDIT Dependencies. Scope: $0 | Focus: $1
> Outdated? Vulnerabilities? License issues? Unnecessary? Conflicts?
> Output: Issues with severity

### config-auditor <- full/focused only

> subagent: Explore
>
> AUDIT Configuration. Scope: $0 | Focus: $1
> Hardcoded values? Missing env vars? Validation? Secrets management?
> Output: Issues with severity

### docs-auditor <- full/focused only

> subagent: Explore
>
> AUDIT Documentation. Scope: $0 | Focus: $1
> Outdated? Missing? Code comments? README accuracy?
> Output: Issues with severity

### consistency-auditor <- full/focused only

> subagent: feature-dev:code-reviewer
>
> AUDIT Consistency. Scope: $0 | Focus: $1
> Naming conventions? Code style? Pattern inconsistencies? File organization?
> Output: Issues with severity

---

## GATE: Audit Complete

```text
AUDIT GATE:
+------------------------------------------------------------+
| Mode: $2 | Agents: [X/Y] completed                        |
+------------------------------------------------------------+
| >=80% → SYNTHESIZE                                          |
| <80% → REPORT PARTIAL + offer retry                         |
+------------------------------------------------------------+
```

---

## FINAL REPORT

```text
+====================================================================+
|                    MEGA SWARM REPORT                                |
+====================================================================+
| Mode: $2 | Agents: [count] | Scope: $0                             |
+--------------------------------------------------------------------+
| P0 Critical: [n] | P1 High:   [n]                                  |
| P2 Medium:   [n] | P3 Low:    [n]                                  |
+--------------------------------------------------------------------+
| Security:    [n] | Performance: [n] | Architecture: [n]             |
| Tests:       [n] | Quality:     [n] | Bugs:         [n]             |
+====================================================================+
```

### P0 Issues (Fix Immediately)

| # | Category | Issue | Location |
|---|----------|-------|----------|

### Recommended Fix Order

1. [Most critical]
2. [Second most critical]

**Next:** `/fix-pipeline "[P0 issue]"`
