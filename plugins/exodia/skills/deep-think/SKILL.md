---
name: deep-think
description: "IF complex problem requiring multiple perspectives THEN use this (5 agents: debugger + architect + explorer → solution + devil's advocate). IF architectural decision needed THEN this. IF straightforward bug THEN fix. IF need competitive solutions THEN tournament. Use BEFORE major design decisions, complex debugging, or architectural changes."
allowed-tools: Task, TodoWrite
---

# Deep Think Partner

Extended multi-perspective reasoning before action.

**Problem:** $1
**Context:** $2 (default: .)
**Mode:** $3 (default: debug, options: debug|architecture|refactor|decision)

---

<CRITICAL_EXECUTION_REQUIREMENT>
**RUN ALL PHASES WITHOUT STOPPING.**

1. Launch all Phase 1 agents in PARALLEL (single message, multiple Task calls)
2. When they complete, IMMEDIATELY proceed to Phase 2
3. When Phase 2 completes, IMMEDIATELY present final recommendation
4. DO NOT ask for confirmation between phases
5. Only stop at the end with the final recommendation

**YOUR NEXT MESSAGE: Launch 3 Task tool calls for Phase 1. NOTHING ELSE.**
</CRITICAL_EXECUTION_REQUIREMENT>

---

## Phase 1: Problem Understanding (3 Parallel Agents)

Launch ALL 3 agents in PARALLEL using a single message with multiple Task tool calls:

### Perspective 1: Debugger Mindset
```yaml
subagent_type: deep-debugger
model: opus
description: "Debugger perspective analysis"
prompt: |
  PROBLEM: [insert $1 here]
  CONTEXT: [insert $2 here, default .]

  THINK AS A DEBUGGER:
  1. What is the actual problem vs perceived problem?
  2. What are ALL possible root causes? (list 5+)
  3. What evidence would confirm/deny each?
  4. What's the minimum viable investigation?
  5. What assumptions am I making?

  DO NOT PROPOSE SOLUTIONS.
  Just understand completely.

  Output: Problem analysis with confidence levels per hypothesis
```

### Perspective 2: Architect Mindset
```yaml
subagent_type: metacognitive-guard:arch-reviewer
model: opus
description: "Architect perspective analysis"
prompt: |
  PROBLEM: [insert $1 here]
  CONTEXT: [insert $2 here, default .]

  THINK AS AN ARCHITECT:
  1. Where does this fit in the system?
  2. What are the boundaries and interfaces?
  3. What invariants might be violated?
  4. What are the ripple effects of changes?
  5. Is this a local issue or systemic?

  Output: Architectural context and implications
```

### Perspective 3: Explorer Mindset
```yaml
subagent_type: feature-dev:code-explorer
description: "Code explorer analysis"
prompt: |
  PROBLEM: [insert $1 here]
  CONTEXT: [insert $2 here, default .]

  EXPLORE THE CODEBASE:
  1. Find all code related to this problem
  2. How is this pattern used elsewhere?
  3. What's the history of this code?
  4. What tests exist for this area?
  5. Similar problems solved before?

  Output: Relevant code map with file:line references
```

**-> IMMEDIATELY proceed to Phase 2 when agents complete. DO NOT STOP.**

---

## Phase 2: Solution Synthesis (2 Parallel Agents)

Launch BOTH agents in PARALLEL:

### Solution Designer
```yaml
subagent_type: dotnet-mtp-advisor
model: opus
description: "Solution synthesis"
prompt: |
  Given the 3 perspectives from Phase 1:

  SYNTHESIZE SOLUTIONS:

  For each potential solution:
  1. What it addresses
  2. Implementation approach
  3. Complexity (1-10)
  4. Confidence (%)
  5. Reversibility
  6. Time to implement

  RANK: confidence x impact / (complexity x risk)

  Output: Top 3 solutions with trade-offs
```

### Devil's Advocate
```yaml
subagent_type: feature-dev:code-reviewer
description: "Devil's advocate review"
prompt: |
  CHALLENGE each proposed solution:

  For each:
  1. What could go wrong?
  2. Worst case scenario?
  3. Hidden assumptions?
  4. What would make this fail?
  5. Is there a simpler approach?

  Output: Risk analysis and blind spots
```

**-> IMMEDIATELY proceed to Phase 3 when agents complete. DO NOT STOP.**

---

## Phase 3: Recommendation

Present the final consolidated output:

### Summary
| Solution | Confidence | Risk | Complexity |
|----------|------------|------|------------|
| Option A | X% | Low/Med/High | 1-10 |
| Option B | X% | Low/Med/High | 1-10 |
| Option C | X% | Low/Med/High | 1-10 |

### Recommendation
**Recommended:** [Option X]
**Reasoning:** [Why this is best given trade-offs]
**Next Steps:** [Concrete actions to take]
