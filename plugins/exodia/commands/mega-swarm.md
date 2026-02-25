---
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

**STEP -1 — Inherit Prior Findings:**
If `<EXODIA_FINDINGS_CONTEXT>` tag exists in session context, `.eight-gates/artifacts/findings.json` already
has prior scan data. Report existing findings instead of re-scanning. Only launch agents for UNCOVERED areas.

**STEP FINAL — Persist Findings:**
After synthesis, write ALL findings to `.eight-gates/artifacts/findings.json`:

```json
{"session":"[ID]","source":"mega-swarm","total_findings":N,"by_category":{...},"findings":[{"id":"...","category":"...","severity":"P0-P3","title":"...","files":[...],"fix":"...","effort":"S|M|L|XL"}]}
```

This enables auto-inherit for ALL downstream Exodia skills in parallel sessions.

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
> AUDIT Architecture. Scope: $0 | Focus: $1. SOLID violations? Coupling? Scalability?

### security-auditor

> subagent: feature-dev:code-reviewer
> AUDIT Security. Scope: $0 | Focus: $1. Injection? Auth? Secrets? OWASP Top 10?

### perf-auditor

> subagent: feature-dev:code-explorer
> AUDIT Performance. Scope: $0 | Focus: $1. N+1? Memory leaks? Blocking calls?

### test-auditor

> subagent: feature-dev:code-reviewer
> AUDIT Test Quality. Scope: $0 | Focus: $1. Coverage gaps? Flaky? Missing edge cases?

### quality-auditor

> subagent: feature-dev:code-reviewer
> AUDIT Code Quality. Scope: $0 | Focus: $1. Dead code? Duplication? Complexity?

### bug-hunter

> subagent: deep-debugger | model: opus
> HUNT Active Bugs. Scope: $0 | Focus: $1. Null refs? Race conditions? Logic errors?

### error-auditor <- full/focused only

> subagent: deep-debugger
> AUDIT Error Handling. Scope: $0 | Focus: $1. Swallowed exceptions? Missing handlers?

### api-auditor <- full/focused only

> subagent: feature-dev:code-explorer
> AUDIT API Contracts. Scope: $0 | Focus: $1. Breaking changes? Doc accuracy?

### dependency-auditor <- full/focused only

> subagent: Explore
> AUDIT Dependencies. Scope: $0 | Focus: $1. Outdated? Vulnerabilities? License?

### config-auditor <- full/focused only

> subagent: Explore
> AUDIT Configuration. Scope: $0 | Focus: $1. Hardcoded values? Missing env vars?

### docs-auditor <- full/focused only

> subagent: Explore
> AUDIT Documentation. Scope: $0 | Focus: $1. Outdated? Missing? README accuracy?

### consistency-auditor <- full/focused only

> subagent: feature-dev:code-reviewer
> AUDIT Consistency. Scope: $0 | Focus: $1. Naming? Style? Pattern inconsistencies?

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
| P0 Critical: [n] | P1 High: [n] | P2 Medium: [n] | P3 Low: [n]    |
+====================================================================+
```

### P0 Issues (Fix Immediately)

| # | Category | Issue | Location |
|---|----------|-------|----------|

**Next:** `/fix-pipeline "[P0 issue]"`
