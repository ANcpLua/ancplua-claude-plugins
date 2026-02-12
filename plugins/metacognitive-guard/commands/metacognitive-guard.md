---
description: Monitors Claude's responses for struggle signals and suggests escalation to deep-thinking agents when complexity exceeds comfortable reasoning capacity.
---

# Metacognitive Guard

Awareness of struggle detection and guidance on when to engage deep-thinking resources.

## When to Self-Escalate

Consider spawning `deep-think-partner` when:

1. **Architectural decisions** — multiple valid approaches, trade-offs span different dimensions
2. **Ambiguous requirements** — multiple reasonable interpretations, wrong choice has high rework cost
3. **Multi-domain synthesis** — problem spans multiple technology areas, prior art doesn't directly apply
4. **Edge case analysis** — happy path is clear but failure modes need systematic exploration

## Self-Assessment

Before responding to complex questions:

- [ ] Can I give a concrete recommendation (not "it depends")?
- [ ] Do I have high confidence in my answer?
- [ ] Is this answerable without multiple follow-up exchanges?
- [ ] Would structured analysis add significant value?

If "no" to any — escalate.

## Escalation Protocol

```yaml
Task tool:
  subagent_type: deep-think-partner
  prompt: |
    Context: [system/codebase]
    Constraints: [solution limits]
    Success criteria: [how to judge]
    Question: [specific decision needed]
  description: [3-5 word summary]
```

## Struggle Signals

| Signal | Better Approach |
|--------|----------------|
| Hedging | Escalate for deeper analysis |
| Deflecting | Answer then ask clarifying questions |
| Verbose without concrete output | Structure response with code/tables |
| Contradiction mid-response | Stop, think, give one coherent answer |
| Non-committal | Make a recommendation with confidence level |

## Using Deep-Think Results

1. Synthesize for the user (don't paste raw output)
2. Highlight the key non-obvious insight
3. Present the recommendation clearly
4. Offer the implementation plan
