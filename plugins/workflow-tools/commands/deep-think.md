---
name: deep-think
description: Extended reasoning with multiple perspectives for complex problems before taking action
arguments:
  - name: problem
    description: "The problem to think deeply about"
    required: true
  - name: context
    description: "Relevant files, directories, or domain"
    default: "."
  - name: mode
    description: "Thinking mode: debug|architecture|refactor|decision"
    default: "debug"
  - name: auto
    description: "Run fully autonomous without pauses (true|false)"
    default: "true"
---

# Deep Think Partner

Extended multi-perspective reasoning before action.

**Problem:** {{ problem }}
**Context:** {{ context }}
**Mode:** {{ mode }}
**Autonomous:** {{ auto }}

---

## EXECUTION MODE

{{#if (eq auto "true")}}
<AUTONOMOUS_MODE>
**RUN ALL PHASES WITHOUT STOPPING.**

1. Launch all Phase 1 agents in PARALLEL (single message, multiple Task calls)
2. When they complete, IMMEDIATELY proceed to Phase 2
3. When Phase 2 completes, IMMEDIATELY present final recommendation
4. DO NOT ask for confirmation between phases
5. Only stop at the end with the final recommendation

GO. Execute now.
</AUTONOMOUS_MODE>
{{else}}
<INTERACTIVE_MODE>
Pause after each phase for user review.
</INTERACTIVE_MODE>
{{/if}}

---

## Phase 1: Problem Understanding

Launch ALL 3 agents in PARALLEL using a single message with multiple Task tool calls:

### Perspective 1: Debugger Mindset
```yaml
subagent_type: deep-debugger
model: opus
prompt: |
  PROBLEM: {{ problem }}
  CONTEXT: {{ context }}

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
subagent_type: framework-migration:architect-review
model: opus
prompt: |
  PROBLEM: {{ problem }}
  CONTEXT: {{ context }}

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
prompt: |
  PROBLEM: {{ problem }}
  CONTEXT: {{ context }}

  EXPLORE THE CODEBASE:
  1. Find all code related to this problem
  2. How is this pattern used elsewhere?
  3. What's the history of this code?
  4. What tests exist for this area?
  5. Similar problems solved before?

  Output: Relevant code map with file:line references
```

{{#if (eq auto "true")}}
**→ IMMEDIATELY proceed to Phase 2 when agents complete. DO NOT STOP.**
{{/if}}

---

## Phase 2: Solution Synthesis

Launch BOTH agents in PARALLEL:

### Solution Designer
```yaml
subagent_type: dotnet-mtp-advisor
model: opus
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

  RANK: confidence × impact / (complexity × risk)

  Output: Top 3 solutions with trade-offs
```

### Devil's Advocate
```yaml
subagent_type: feature-dev:code-reviewer
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

{{#if (eq auto "true")}}
**→ IMMEDIATELY proceed to Phase 3 when agents complete. DO NOT STOP.**
{{/if}}

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

---

## Mode-Specific Focus

{{#if (eq mode "architecture")}}
Focus agents on:
- System boundaries
- Dependency directions
- Interface contracts
- Scalability implications
{{/if}}

{{#if (eq mode "refactor")}}
Focus agents on:
- Current vs desired state
- Migration path
- Breaking changes
- Incremental approach
{{/if}}

{{#if (eq mode "decision")}}
Focus agents on:
- Options enumeration
- Trade-off matrix
- Reversibility
- Stakeholder impact
{{/if}}
