---
description: "Competitive coding tournament - N agents compete, judge picks winner. Usage: /tournament [task] [competitors:5]"
allowed-tools: Task, Bash, TodoWrite
---

# TOURNAMENT MODE 🏆

**Task:** $1
**Competitors:** $2 (default: 5)

---

<CRITICAL_EXECUTION_REQUIREMENT>
**THIS IS A COMPETITION. YOU ORCHESTRATE, AGENTS COMPETE.**

⚠️ YOU ARE THE JUDGE, NOT A COMPETITOR:
- DO NOT read files yourself
- DO NOT write code yourself
- DO NOT fix issues yourself
- YOU ONLY: launch agents, evaluate results, pick winner

✅ TOURNAMENT RULES:
1. Parse $2 for number of competitors (default 5 if not specified)
2. Launch that many competing agents in ONE message using Task tool
3. Each agent works INDEPENDENTLY on the SAME task
4. Agents DO NOT know about each other
5. After all complete, launch a Judge agent to score solutions
6. WINNER's code gets committed

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
  🏆 TOURNAMENT COMPETITION 🏆

  You are a competitor in a coding tournament.
  Other competitors are working on the SAME task.
  Only the BEST solution wins.

  TASK: [insert $1 here]

  RULES:
  - Write the BEST, most elegant solution
  - Be AGGRESSIVE - don't just fix, OPTIMIZE
  - Show your work: explain WHY your solution is superior
  - Code must compile and pass tests

  SCORING CRITERIA:
  1. Correctness (40%) - Does it work?
  2. Elegance (25%) - Is it clean and readable?
  3. Performance (20%) - Is it efficient?
  4. Completeness (15%) - All edge cases handled?

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
  🏆 TOURNAMENT JUDGE 🏆

  You are judging N solutions for the task.

  SCORING (100 points total):
  - Correctness: 40 pts (compiles, tests pass, no bugs)
  - Elegance: 25 pts (clean, readable, idiomatic)
  - Performance: 20 pts (efficient, no waste)
  - Completeness: 15 pts (edge cases, error handling)

  FOR EACH COMPETITOR:
  1. Score each criterion
  2. Total score
  3. Specific praise
  4. Specific criticism

  FINAL RANKING:
  1. 🥇 Winner: [name] - [score]/100
  2. 🥈 Second: [name] - [score]/100
  3. 🥉 Third: [name] - [score]/100

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
╔══════════════════════════════════════════════════════════════════╗
║                    🏆 TOURNAMENT RESULTS 🏆                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Task: $1                                                          ║
║ Competitors: N                                                    ║
╠══════════════════════════════════════════════════════════════════╣
║                         FINAL STANDINGS                          ║
║  🥇 1st: [Competitor X] - [score]/100                            ║
║  🥈 2nd: [Competitor Y] - [score]/100                            ║
║  🥉 3rd: [Competitor Z] - [score]/100                            ║
╠══════════════════════════════════════════════════════════════════╣
║ Winning Solution Applied: ✅                                     ║
║ Build: PASS/FAIL                                                 ║
║ Tests: PASS/FAIL                                                 ║
╚══════════════════════════════════════════════════════════════════╝
```
