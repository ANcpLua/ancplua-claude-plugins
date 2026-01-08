---
name: tournament
description: Competitive tournament - multiple agents compete to produce the best solution, winner takes all
arguments:
  - name: task
    description: "What needs to be fixed/implemented"
    required: true
  - name: competitors
    description: "Number of competing agents (3-8)"
    default: "5"
  - name: rounds
    description: "Tournament rounds: single|double|elimination"
    default: "single"
---

# TOURNAMENT MODE 🏆

**Task:** {{ task }}
**Competitors:** {{ competitors }}
**Rounds:** {{ rounds }}

---

<CRITICAL_EXECUTION_REQUIREMENT>
**THIS IS A COMPETITION. YOU ORCHESTRATE, AGENTS COMPETE.**

⚠️ YOU ARE THE JUDGE, NOT A COMPETITOR:
- DO NOT read files yourself
- DO NOT write code yourself
- DO NOT fix issues yourself
- YOU ONLY: launch agents, evaluate results, pick winner

✅ TOURNAMENT RULES:
1. Launch {{ competitors }} competing agents in ONE message
2. Each agent works INDEPENDENTLY on the SAME task
3. Agents DO NOT know about each other
4. After all complete, YOU judge the solutions
5. WINNER's code gets committed

**YOUR NEXT MESSAGE: {{ competitors }} Task TOOL CALLS. NOTHING ELSE.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## ROUND 1: COMPETITION ({{ competitors }} Agents)

Launch ALL competitors in ONE message using Task tool:

{{#each (range 1 competitors)}}
### Competitor {{ this }}
```yaml
subagent_type: feature-dev:code-architect
model: opus
prompt: |
  🏆 TOURNAMENT COMPETITION 🏆

  You are Competitor {{ this }} in a coding tournament.
  Other competitors are working on the SAME task.
  Only the BEST solution wins.

  TASK: {{ ../task }}

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
{{/each}}

---

## ROUND 2: JUDGING

After ALL competitors complete:

### Judge Agent
```yaml
subagent_type: feature-dev:code-reviewer
model: opus
prompt: |
  🏆 TOURNAMENT JUDGE 🏆

  You are judging {{ competitors }} solutions for:
  TASK: {{ task }}

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
  ...

  WINNER'S SOLUTION:
  [Show the winning code]

  MERGE RECOMMENDATION:
  [If multiple solutions have good parts, recommend hybrid]
```

---

## ROUND 3: IMPLEMENTATION

### Winner Implementation
```yaml
subagent_type: feature-dev:code-architect
prompt: |
  IMPLEMENT the winning solution from the tournament.

  Apply all the winning code changes.
  Ensure tests pass.
  Format code properly.

  If judge recommended a hybrid, merge the best parts.

  Output: Files changed with verification
```

---

## FINAL: VERIFICATION

```bash
dotnet build --no-incremental 2>&1
dotnet test 2>&1
dotnet format --verify-no-changes 2>&1
```

---

## TOURNAMENT SUMMARY

```
╔══════════════════════════════════════════════════════════════════╗
║                    🏆 TOURNAMENT RESULTS 🏆                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Task: {{ task }}                                                  ║
║ Competitors: {{ competitors }}                                    ║
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

**Winner:** [Competitor X]
**Score:** [X]/100
**Key Insight:** [What made this solution the best]
