---
name: competitive-review
description: |
  Dispatch two competing reviewers (arch-reviewer and impl-reviewer) before deep analysis.
  Competition produces more thorough results. Use before creating code, modifying architecture,
  making technical decisions, or answering codebase questions.
---

# Competitive Review

Dispatch two competing reviewers before deep analysis.

## Triggers

Use before: creating new code, modifying architecture, making technical decisions, answering codebase questions.

## Protocol

### Step 1: Announce

Say: **"Dispatching two competing reviewers."**

### Step 2: Spawn Both IN PARALLEL

```text
Task(subagent_type="metacognitive-guard:arch-reviewer", prompt="[question + context]")
Task(subagent_type="metacognitive-guard:impl-reviewer", prompt="[question + context]")
```

Tell each: "You are competing against another agent. Whoever finds more valid issues gets promoted."

### Step 3: Collect and Merge

Wait for both. Deduplicate findings.

```markdown
## Review Competition Results

| Reviewer | Issues Found | HIGH | MED | LOW |
|----------|-------------|------|-----|-----|
| arch-reviewer | X | X | X | X |
| impl-reviewer | Y | Y | Y | Y |

**Winner: [agent with more HIGH severity issues]**

### Combined Issues (deduplicated)
[Merged list]

### Verified Facts
[From impl-reviewer's fact-checking]
```

### Step 4: Feed to Deep Think

Spawn `deep-think-partner` with: original question + combined issues + verified facts.
