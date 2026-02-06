---
name: tournament
description: "Use when multiple valid approaches exist and you need the best one. N agents compete, judge picks winner. For complex trade-offs without competition -> use deep-think."
allowed-tools: Task, Bash, TodoWrite
---

# TOURNAMENT MODE

**Task:** $1
**Competitors:** $2 (default: 5)

---

## SCORING SYSTEM (Visible to ALL Competitors)

| Finding Type | Points |
|--------------|--------|
| **Correctness** (compiles, tests pass, no bugs) | 40 pts |
| **Elegance** (clean, readable, idiomatic) | 25 pts |
| **Performance** (efficient, no waste) | 20 pts |
| **Completeness** (edge cases, error handling) | 15 pts |
| **PENALTIES** | |
| Style/formatting nitpicks | -2 pts |
| Over-engineering | -3 pts |
| Unnecessary complexity | -3 pts |
| Code that doesn't compile | -10 pts |
| False claims about solution | -5 pts |

### Tiebreaker Rules

If two competitors have equal scores:
1. Higher Correctness score wins
2. If still tied: Higher Performance score wins
3. If still tied: First submitted solution wins

---

<CRITICAL_EXECUTION_REQUIREMENT>
**THIS IS A COMPETITION. YOU ORCHESTRATE, AGENTS COMPETE.**

YOU ARE THE JUDGE, NOT A COMPETITOR:
- DO NOT read files yourself
- DO NOT write code yourself
- DO NOT fix issues yourself
- YOU ONLY: launch agents, evaluate results, pick winner

TOURNAMENT RULES:
1. Parse $2 for number of competitors (default 5 if not specified)
2. Launch that many competing agents in ONE message using Task tool
3. Each agent works INDEPENDENTLY on the SAME task
4. Agents DO NOT know about each other
5. Competitors see scoring rubric UPFRONT (transparency)
6. After all complete, launch a Judge agent to score solutions
7. WINNER's code gets committed

**YOUR NEXT MESSAGE: Launch N Task tool calls (one per competitor). NOTHING ELSE.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## ROUND 1: COMPETITION

For EACH competitor, launch a Task with:

```yaml
subagent_type: feature-dev:code-architect
model: opus
description: "Tournament competitor N"
prompt: |
  TOURNAMENT COMPETITION

  You are a competitor in a coding tournament.
  Other competitors are working on the SAME task.
  Only the BEST solution wins.

  TASK: [insert $1 here]

  ===============================================================
  SCORING RUBRIC (100 points total):
  ---------------------------------------------------------------
  Correctness:   40 pts - Compiles, tests pass, no bugs
  Elegance:      25 pts - Clean, readable, idiomatic
  Performance:   20 pts - Efficient, no waste
  Completeness:  15 pts - Edge cases, error handling

  PENALTIES (applied by judge):
     Style nitpicks:        -2 pts
     Over-engineering:      -3 pts
     Unnecessary complexity: -3 pts
     Doesn't compile:       -10 pts
     False claims:          -5 pts

  TIEBREAKER: Correctness -> Performance -> First submitted
  ===============================================================

  RULES:
  - Write the BEST, most elegant solution
  - Be AGGRESSIVE - don't just fix, OPTIMIZE
  - Show your work: explain WHY your solution is superior
  - Code must compile and pass tests
  - AVOID nitpicks and over-engineering (penalties!)

  At the end, explain why YOUR solution should win.

  Output:
  - All code changes (full files or diffs)
  - Explanation of approach
  - Why this solution is BEST
```

---

## ROUND 2: JUDGING

After ALL competitors complete, launch ONE judge:

```yaml
subagent_type: feature-dev:code-reviewer
model: opus
description: "Tournament judge"
prompt: |
  TOURNAMENT JUDGE

  You are judging N solutions for the task.

  ===============================================================
  SCORING (100 points total):
  ---------------------------------------------------------------
  Correctness:   40 pts - Compiles, tests pass, no bugs
  Elegance:      25 pts - Clean, readable, idiomatic
  Performance:   20 pts - Efficient, no waste
  Completeness:  15 pts - Edge cases, error handling

  PENALTIES (APPLY THESE):
     Style nitpicks:        -2 pts
     Over-engineering:      -3 pts
     Unnecessary complexity: -3 pts
     Doesn't compile:       -10 pts
     False claims:          -5 pts

  TIEBREAKER: Correctness -> Performance -> First submitted
  ===============================================================

  FOR EACH COMPETITOR:
  1. Score each positive criterion (0-max)
  2. Apply penalty deductions
  3. Calculate total score
  4. Specific praise (what they did well)
  5. Specific criticism (what cost them points)

  DETAILED SCORECARD:
  | Competitor | Correct | Elegant | Perf | Complete | Penalties | TOTAL |
  |------------|---------|---------|------|----------|-----------|-------|
  | 1          | /40     | /25     | /20  | /15      | -X        | /100  |
  | 2          | /40     | /25     | /20  | /15      | -X        | /100  |
  | ...        |         |         |      |          |           |       |

  PENALTY LOG:
  - Competitor X: -2 (style nitpick: [reason])
  - Competitor Y: -3 (over-engineering: [reason])

  FINAL RANKING:
  1. Winner: [name] - [score]/100
  2. Second: [name] - [score]/100
  3. Third: [name] - [score]/100

  TIEBREAKER APPLIED: [Yes/No - explain if yes]

  WINNER'S SOLUTION:
  [Show the winning code that should be applied]
```

---

## ROUND 3: IMPLEMENTATION

Launch ONE implementer:

```yaml
subagent_type: feature-dev:code-architect
description: "Implement winner solution"
prompt: |
  IMPLEMENT the winning solution from the tournament.

  Apply all the winning code changes.
  Ensure tests pass.
  Format code properly.

  Output: Files changed with verification
```

---

## FINAL: VERIFICATION

```bash
dotnet build 2>&1 || npm run build 2>&1 || make build 2>&1
dotnet test 2>&1 || npm test 2>&1 || make test 2>&1
```

---

## SUMMARY

After completion, output:

```
+====================================================================+
|                    TOURNAMENT RESULTS                               |
+====================================================================+
| Task: $1                                                            |
| Competitors: N                                                      |
+====================================================================+
|                         FINAL STANDINGS                             |
|  1st: [Competitor X] - [score]/100                                  |
|  2nd: [Competitor Y] - [score]/100                                  |
|  3rd: [Competitor Z] - [score]/100                                  |
+====================================================================+
| Winning Solution Applied: YES                                       |
| Build: PASS/FAIL                                                    |
| Tests: PASS/FAIL                                                    |
+====================================================================+
```
