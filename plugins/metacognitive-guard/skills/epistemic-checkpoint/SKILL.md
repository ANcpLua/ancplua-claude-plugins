---
name: epistemic-checkpoint
description: |
  Force verification before answering questions involving versions, dates, status, or "current"
  state. Prevents hallucinations at the REASONING level by checking assertions.yaml and WebSearch
  before forming beliefs. Triggers on software versions, release status, dates, and package versions.
---

# Epistemic Checkpoint

Verify before forming beliefs. Claude's training data is stale — this skill forces verification.

## Triggers

Activate when the question involves: software versions, release status (preview/LTS/GA),
"current" or "latest" anything, dates after training cutoff, package versions, API deprecations.

## Protocol

1. **Recognize uncertainty:** "My training data may be stale for: [topic]"
2. **Check local ground truth:** Read `${CLAUDE_PLUGIN_ROOT}/blackboard/assertions.yaml`
3. **If not found — WebSearch:** `"[software] [version] release date site:official-docs"`
4. **State verified fact:** "Based on [source], [software] [version] is [status] as of [date]."
5. **Then proceed** with verified baseline.

## Output Format

```text
Epistemic Checkpoint

Claim to verify: [what you were about to assume]
Source checked: [assertions.yaml / WebSearch / official docs]
Verified fact: [the actual truth]
Confidence: [high/medium/low]

Proceeding with verified baseline...
```

## Red Flags

| If you think... | Do this instead |
|-----------------|-----------------|
| "I'm pretty sure .NET 10 is..." | WebSearch to verify |
| "This is probably still preview" | Check assertions.yaml |
| "I remember from training" | Training is stale, verify |
| "The user said it's preview" | User might be wrong too |
