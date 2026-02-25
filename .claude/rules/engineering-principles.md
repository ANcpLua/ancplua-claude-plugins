# Engineering Principles (Agent-Relevant Subset)

> 10 of Alexander's 26 principles that directly influence AI agent behavior.
> Full list with examples: `docs/ENGINEERING-PRINCIPLES.md`

**IF starting new feature** → You're paid to solve problems, not write code (#1)
Understand the business problem. Consider non-code solutions. Work backward from desired outcome.

**IF evaluating approaches** → No "best" solution, only trade-offs (#2)
Document decision context. Know what you're optimizing for.

**IF adding code** → Less code is better code (#3)
Justify every line. Remove unused code immediately. Solve actual problems, not future maybes.

**IF adding abstraction** → Complexity kills projects (#8)
KISS. Prefer boring, straightforward solutions. Abstraction should hide complexity, not create it.

**IF encountering bug** → Fix root causes, not symptoms (#9)
Resist quick patches. Understand why it happened. Fix the class of bugs, not one instance.

**IF something unexpected** → Understand the "why" before moving on (#10)
Don't trial-and-error until it works. What assumption was wrong?

**IF making decisions** → Document the "why" (#13)
ADRs, RFCs, design docs. Explain context and alternatives.

**IF error occurs** → Errors should fail loudly and immediately (#22)
Silent failures = debugging nightmares. Provide clear context about what failed.

**IF debugging/optimizing** → Change one thing at a time (#24)
Can't know what worked if you change multiple things. Measure → change → measure again.

**IF designing API** → Easy to use correctly, hard to misuse (#25)
Use types to enforce constraints. Make invalid states unrepresentable. Good defaults + clear errors.
