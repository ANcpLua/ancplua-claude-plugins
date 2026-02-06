---
name: deep-think
description: "IF complex problem needing multi-perspective analysis THEN use this. 5 agents, 3 phases: understand→synthesize→recommend. No implementation. For competing implementations → tournament."
allowed-tools: Task, TodoWrite
---

# DEEP THINK — Multi-Perspective Reasoning Before Action

> Three perspectives. One synthesis. No implementation — just understanding.

**Problem:** $1
**Context:** $2 (default: .)
**Mode:** $3 (default: debug | debug|architecture|refactor|decision)

---

## TEAM ARCHITECTURE

```text
THINK LEAD (You — Synthesizer)
│
├─ Phase 1: PROBLEM UNDERSTANDING (3 agents parallel)
│  ├── debugger-mind
│  ├── architect-mind
│  └── explorer-mind
│  └── → IMMEDIATELY proceed
│
├─ Phase 2: SOLUTION SYNTHESIS (2 agents parallel)
│  ├── solution-designer
│  └── devils-advocate
│  └── → IMMEDIATELY proceed
│
└─ Phase 3: RECOMMENDATION (you — consolidate)
   └── Summary table + recommended action
```

---

<CRITICAL_EXECUTION_REQUIREMENT>

**RUN ALL 3 PHASES WITHOUT STOPPING.**

1. Launch 3 Phase 1 agents in ONE message
2. When complete, IMMEDIATELY launch 2 Phase 2 agents
3. When complete, IMMEDIATELY present recommendation

**DO NOT** ask for confirmation between phases.
**YOUR NEXT MESSAGE: 3 Task tool calls for Phase 1. NOTHING ELSE.**

</CRITICAL_EXECUTION_REQUIREMENT>

---

## PHASE 1: PROBLEM UNDERSTANDING — 3 Agents

Launch ALL 3 in ONE message.

### debugger-mind

> subagent: deep-debugger | model: opus
>
> You are debugger-mind. THINK AS A DEBUGGER.
> PROBLEM: $1 | CONTEXT: $2
>
> 1. Actual problem vs perceived problem?
> 2. ALL possible root causes (5+)
> 3. Evidence to confirm/deny each
> 4. Minimum viable investigation
> 5. Assumptions being made
>
> DO NOT propose solutions. Just understand completely.
> Output: Problem analysis with confidence per hypothesis

### architect-mind

> subagent: metacognitive-guard:arch-reviewer | model: opus
>
> You are architect-mind. THINK AS AN ARCHITECT.
> PROBLEM: $1 | CONTEXT: $2
>
> 1. Where does this fit in the system?
> 2. Boundaries and interfaces?
> 3. Invariants violated?
> 4. Ripple effects of changes?
> 5. Local issue or systemic?
>
> Output: Architectural context and implications

### explorer-mind

> subagent: feature-dev:code-explorer
>
> You are explorer-mind. EXPLORE THE CODEBASE.
> PROBLEM: $1 | CONTEXT: $2
>
> 1. All code related to this problem
> 2. Pattern used elsewhere?
> 3. History of this code
> 4. Tests for this area?
> 5. Similar problems solved before?
>
> Output: Relevant code map with file:line references

---

## PHASE 2: SOLUTION SYNTHESIS — 2 Agents

Launch BOTH in ONE message.

### solution-designer

> subagent: feature-dev:code-architect | model: opus
>
> SYNTHESIZE solutions from Phase 1's 3 perspectives.
>
> Per solution: what it addresses, implementation approach, complexity (1-10), confidence (%), reversibility, time estimate.
> Rank by: confidence × impact / (complexity × risk).
> Output: Top 3 solutions with trade-offs

### devils-advocate

> subagent: feature-dev:code-reviewer
>
> CHALLENGE each proposed solution:
> What could go wrong? Worst case? Hidden assumptions? Simpler approach?
> Output: Risk analysis and blind spots

---

## PHASE 3: RECOMMENDATION

Present consolidated output:

| Solution | Confidence | Risk | Complexity |
|----------|------------|------|------------|
| Option A | X% | Low/Med/High | 1-10 |
| Option B | X% | Low/Med/High | 1-10 |
| Option C | X% | Low/Med/High | 1-10 |

**Recommended:** [Option X]
**Reasoning:** [Why this is best given trade-offs]
**Next Steps:** [Concrete actions — e.g., `/fix "implement option A"` ]
