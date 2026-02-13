---
description: Structured 4-phase analysis with transparent reasoning and adversarial self-review. Use for complex decisions, architecture choices, debugging dead-ends, or any problem where jumping straight to implementation would be premature.
---

# Deep Analysis

Structured thinking for problems that deserve more than a first-pass answer.

## When to Use

- Complex decisions with competing trade-offs
- Debugging gone 2+ rounds without resolution
- Any task where you catch yourself about to guess
- Multiple valid approaches, unclear winner

## Phase 1: Decompose & Assess

Before touching code or making decisions, show your reasoning:

```text
THINKING: [problem decomposition]
- Core question: [what are we actually solving]
- Constraints: [what limits the solution space]
- Dependencies: [what this connects to]
- Unknowns: [what I don't know yet]

WEB SEARCH: [NEEDED / NOT NEEDED / DEFERRED]
- Reason: [why]
- If needed: [what specific info to find]
```

### Web Search Decision

**NEEDED:** Current API docs, versions, breaking changes, third-party library usage,
security patches, compatibility verification.

**NOT NEEDED:** Analyzing existing workspace code, established programming concepts,
internal refactoring, basic syntax.

**DEFERRED:** Need workspace exploration first, multiple approaches need evaluation
before knowing what to research.

## Phase 2: Adversarial Review

Red-team your own thinking before implementing:

```text
CHALLENGE:
- Assumption I'm making: [what could be wrong]
- Alternative approach: [what else could work]
- Failure mode: [how this breaks]
- What I'm missing: [blind spots]
```

For high-stakes decisions — spawn competing reviewers in parallel:

> Dispatch `arch-reviewer` + `impl-reviewer` via Task tool.
> They compete. Whoever finds more valid issues gets promoted.
> Run both in background (`run_in_background: true`) — async, non-blocking.
> Continue Phase 3 prep while they work.

## Phase 3: Implement with Transparency

Show reasoning at each decision point:

```text
DECISION: [what you chose and why]
- Chose X over Y because: [specific reason]
- Trade-off accepted: [what you're giving up]
```

- Think between tool calls — don't just chain actions mindlessly
- Reflect on previous step outcomes before proceeding
- If results surprise you, return to Phase 2

## Phase 4: Verify Completion

Before claiming done:

- [ ] Core question from Phase 1 actually answered
- [ ] No open unknowns left unaddressed
- [ ] Adversarial concerns from Phase 2 resolved or documented
- [ ] Solution tested, not just implemented
- [ ] Edge cases handled, not just happy path
