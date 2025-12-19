---
name: using-superpowers
description: |
  Master orchestrator that forces explicit skill awareness before complex tasks.
  Triggers on "help me build/create", "architect/design", or multi-step technical questions.
  Increases verification compliance from 30-50% to 80%+ through explicit verbalization.
---

# Using Superpowers

Master orchestrator that forces explicit skill awareness before complex tasks.

## Purpose

This skill exists to make Claude STOP and THINK before diving into complex tasks. Without explicit
verbalization, Claude skips verification 30-50% of the time. With it, compliance rises to 80%+.

## Triggers

Use this skill when you see ANY of these patterns:

- "help me build/create/implement"
- "how should I architect/design"
- "what's the best approach"
- Multi-step technical questions
- Questions involving versions, dates, or "current" state

## Activation Protocol

### Step 1: Announce

Say aloud: **"This is a complex task. Activating full analysis chain."**

### Step 2: List Applicable Skills

| Skill | Applies? | Why |
|-------|----------|-----|
| epistemic-checkpoint | ? | Does this involve versions/dates/status? |
| competitive-review | ? | Is this architecturally complex? |
| verification-before-completion | ? | Will I claim something "works"? |

### Step 3: Execute Pre-Filters FIRST

1. **epistemic-checkpoint** (if versions/facts involved)
2. **WebSearch** (if anything might be stale)
3. **Read assertions.yaml** (for project-specific ground truth)

### Step 4: Execute Power Skills

- **competitive-review** - dispatch arch-reviewer + impl-reviewer
- **deep-think-partner** - for complex reasoning (with verified context)

### Step 5: Present + TodoWrite

- Show analysis to user
- Ask: "Ready to proceed?"
- Create tasks from checkpoints

## Why Verbalization Works

Without explicit verbalization:

- Claude might skip verification
- Claude might start coding with wrong assumptions
- Claude might confidently produce garbage

With explicit verbalization:

- Creates behavioral anchors
- Actually executes the checks
- Catches stale knowledge before it propagates

## Red Flag Thoughts (REJECT THESE)

| If you think... | Actually do... |
|-----------------|----------------|
| "I'll skip the review, it's simple" | NO. Run the full chain. |
| "I already know the answer" | Your knowledge may be WRONG. Verify. |
| "Competition is overkill" | Competition catches more issues. Do it. |
| "This is a quick question" | Quick questions often have wrong answers. |

## The Flow

```text
User Question
     |
[Announce] "This is a complex task..."
     |
[List skills] Check which apply
     |
[epistemic-checkpoint] Verify facts
     |
[competitive-review] Find issues
     |
[deep-think-partner] Structured plan
     |
[Present + TodoWrite]
```
