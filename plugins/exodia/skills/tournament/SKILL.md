---
name: tournament
description: "IF multiple valid approaches THEN use this. N agents compete, judge picks winner by penalty scoring. For trade-offs without competition → deep-think."
allowed-tools: Task, Bash, TodoWrite
---

# TOURNAMENT — Competitive Coding with Penalty Scoring

> N competitors. 1 judge. Winner's code ships.

**Task:** $0
**Competitors:** $1 (default: 5)

---

## SCORING (Visible to ALL)

| Criterion | Points | Penalty | Points |
|-----------|--------|---------|--------|
| Correctness | 40 | Style nitpicks | -2 |
| Elegance | 25 | Over-engineering | -3 |
| Performance | 20 | Unnecessary complexity | -3 |
| Completeness | 15 | Doesn't compile | -10 |
| | | False claims | -5 |

**Tiebreaker:** Correctness → Performance → First submitted

---

## TEAM ARCHITECTURE

```text
TOURNAMENT JUDGE (You — Orchestrator)
│
├─ Round 1: COMPETITION ($1 parallel competitors)
│  ├── competitor-1
│  ├── competitor-2
│  ├── ...
│  └── competitor-N
│  └── GATE → all complete
│
├─ Round 2: JUDGING (1 agent)
│  └── tournament-judge
│  └── GATE → winner selected
│
└─ Round 3: IMPLEMENTATION (1 agent)
   └── winner-implementer
   └── Build + Test → SHIPPED | BLOCKED
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**YOU ARE THE JUDGE, NOT A COMPETITOR.**

- DO NOT read files, write code, or fix issues yourself
- YOU ONLY: launch competitors, evaluate results, pick winner

1. Parse $1 for competitor count (default 5)
2. Launch $1 competitors in ONE message (Task tool, parallel)
3. Each works INDEPENDENTLY — no knowledge of others
4. Launch 1 judge to score all solutions
5. Launch 1 implementer for winning solution
6. Verify build + tests

**YOUR NEXT MESSAGE: $1 Task tool calls. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## ROUND 1: COMPETITION

Launch $1 agents in ONE message. Identical prompt per competitor:

### competitor-N (one per competitor)

> subagent: feature-dev:code-architect | model: opus
>
> TOURNAMENT — You are competing against others on the SAME task. Only the BEST wins.
>
> TASK: $0
>
> SCORING: Correctness(40) + Elegance(25) + Performance(20) + Completeness(15) = 100
> PENALTIES: Style(-2), Over-engineering(-3), Complexity(-3), No-compile(-10), False claims(-5)
> TIEBREAKER: Correctness → Performance → First submitted
>
> Write the BEST solution. Code must compile and pass tests. AVOID penalties.
> Explain WHY your solution should win.
>
> Output: All code changes + approach explanation + why this wins

---

## ROUND 2: JUDGING

### tournament-judge

> subagent: feature-dev:code-reviewer | model: opus
>
> JUDGE $1 solutions for: $0
>
> SCORING: Correctness(40) + Elegance(25) + Performance(20) + Completeness(15)
> PENALTIES: Style(-2), Over-engineering(-3), Complexity(-3), No-compile(-10), False claims(-5)
> TIEBREAKER: Correctness → Performance → First submitted
>
> For each: score criteria, apply penalties, calculate total.
>
> Output:
> SCORECARD: | Competitor | Correct | Elegant | Perf | Complete | Penalties | TOTAL |
> PENALTY LOG: Competitor X: -N (reason)
> FINAL RANKING with winner's solution code

---

## ROUND 3: IMPLEMENTATION

### winner-implementer

> subagent: feature-dev:code-architect
>
> IMPLEMENT the winning tournament solution.
> Apply all code changes. Ensure tests pass. Format properly.
> Output: Files changed + verification

---

## VERIFICATION

```bash
dotnet build 2>&1 || npm run build 2>&1 || make build 2>&1
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1
```

---

## FINAL REPORT

```text
+====================================================================+
|                    TOURNAMENT RESULTS                               |
+====================================================================+
| Task: $0 | Competitors: $1                                          |
+--------------------------------------------------------------------+
| 1st: [name] — [score]/100                                           |
| 2nd: [name] — [score]/100                                           |
| 3rd: [name] — [score]/100                                           |
+--------------------------------------------------------------------+
| Winner Applied: YES | Build: PASS/FAIL | Tests: PASS/FAIL           |
+====================================================================+
```
