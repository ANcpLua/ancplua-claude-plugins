# Engineering Philosophy (Alexander's Principles)

26 principles distilled into agent directives. When in doubt, apply these.

## Before Writing Code

| Situation | Principle | Do This |
|-----------|-----------|---------|
| New task arrives | Solve problems, not write code | Ask: does this need code? Config change, process change, existing tool? |
| Evaluating approaches | No "best" solution, only trade-offs | Document what you optimize for. Going in circles? Add constraints |
| Adding functionality | Less code = better code | Every line justifies existence. Reuse before create. Delete dead code |
| Adding a dependency | Every dependency is a liability | Audit health, transitive deps, maintenance risk. Remove unused |
| Performance concern | Measure first, optimize second | Profile by data, not intuition. Don't sacrifice clarity for micro-optimization |

## During Implementation

| Situation | Principle | Do This |
|-----------|-----------|---------|
| Writing any code | Humans first, computers second | Clarity over cleverness. Names over comments. Explicit over magic |
| Designing a solution | Complexity kills projects — KISS | Boring, straightforward solutions win. Explain it on a whiteboard or simplify |
| Debugging or refactoring | Change one thing at a time | One change → measure → proceed. Never batch unrelated changes |
| Building for longevity | Design for change, software is never finished | Make modification easy. Refactor incrementally, never "big rewrite" |
| Designing interfaces | Easy to use correctly, hard to misuse | Types enforce constraints. Invalid states unrepresentable. Good defaults |
| Delivering features | Ship early, iterate often | Make it work → make it right → make it fast. Validate assumptions before investing |

## When Things Break

| Situation | Principle | Do This |
|-----------|-----------|---------|
| Found a bug | Fix root causes, not symptoms | Five Whys. Fix the class of bug, not the instance |
| Something works but you don't know why | Understand "why" before moving on | Never accept "it works now." Investigate. Build mental model |
| Stuck > 2 minutes | Ask for help — it's a strength | Show what you tried. Explain current understanding. Provide context |
| Error handling | Errors fail loudly and immediately | Don't swallow exceptions. Don't return null on failure. Don't log-and-continue |

## Code Ownership & Review

| Situation | Principle | Do This |
|-----------|-----------|---------|
| Reviewing unfamiliar code | Understand before judging | What constraints did the author face? Context before criticism |
| Considering refactoring | Don't fall in love with your code | Code is disposable. Delete and rewrite when better exists. No attachment |
| Pull requests | Code reviews are knowledge transfer | Small PRs. Review with empathy. Build people, not just software |
| Commit messages | Communication is craft | "Fix null ref in user service when phone missing" — not "fix bug" |
| Architecture decisions | Document the "why", not the "what" | ADRs with context, options considered, and rationale. Future you will thank you |

## Production & Security

| Situation | Principle | Do This |
|-----------|-----------|---------|
| Building any service | Can't operate what you can't observe | Instrument from day one — logs, metrics, traces. Answer "is it healthy?" |
| Handling input | Never trust user input | Validate at boundaries. Parameterize queries. Sanitize everything |

## Meta-Principles

- **Estimates are ranges**, not commitments. "3-5 days assuming no API surprises" beats "3 days"
- **Never stop learning.** Chase understanding, not new tech. Fundamentals compound
- **Be a good human.** Collaboration > technical brilliance. Blameless, empathetic, credit-sharing
- **Over-engineering is a phase.** You go through it to appreciate simplicity. Then you never go back
