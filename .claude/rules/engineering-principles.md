# Engineering Principles (Routing Index)

> **Source:** Alexander's battle-tested wisdom from years of software engineering. Full details in `docs/ENGINEERING-PRINCIPLES.md`.

## Problem Solving & Design

**IF starting new feature** → Remember: You're paid to solve problems, not write code (#1)
- Understand business problem first
- Consider non-code solutions
- Work backward from desired outcome

**IF evaluating approaches** → No "best" solution, only trade-offs (#2)
- Document decision context
- Know what you're optimizing for
- If stuck in circles → need more constraints

**IF adding code** → Less code is better code (#3)
- Justify every line's existence
- Remove unused code immediately
- Solve actual problems, not future maybes

**IF adding dependency** → Every dependency is a liability (#4)
- Audit regularly, remove unused
- Check maintenance health
- Evaluate total cost of ownership

**IF designing system** → Design for change (#6)
- Software is never finished
- Make it easy to modify
- Refactor incrementally, not "big rewrite"

## Shipping & Iteration

**IF building feature** → Ship early, iterate often (#5)
- Perfect is the enemy of done
- Get real user feedback fast
- Validate before heavy investment

**IF writing code** → Write for humans first, computers second (#7)
- Code is read 100x more than written
- Clarity over cleverness
- Think about the 3 AM debugger

**IF adding abstraction** → Complexity kills projects (#8)
- KISS: Keep It Simple, Stupid
- Prefer boring, straightforward solutions
- Abstraction should hide complexity, not create it

## Debugging & Root Causes

**IF encountering bug** → Fix root causes, not symptoms (#9)
- Resist quick patches
- Understand why it happened
- Fix the class of bugs, not one instance

**IF something unexpected** → Understand the "why" before moving on (#10)
- Don't trial-and-error until it works
- What assumption was wrong?
- Hope is not a strategy

**IF debugging/optimizing** → Change one thing at a time (#24)
- Can't know what worked if you change multiple things
- Measure → change → measure again
- Scientific method applies to software

## Code Quality & Collaboration

**IF reviewing code** → Don't fall in love with your code (#11)
- Code is a tool, not your baby
- Be willing to delete and refactor
- Remove ego from technical decisions

**IF seeing "bad" code** → Seek to understand before judging (#12)
- What constraints did they face?
- What was the context?
- Review code with empathy

**IF making decisions** → Document the "why" (#13)
- ADRs, RFCs, comments, design docs
- Explain context and alternatives
- Save future-you hours of confusion

**IF committing** → Write meaningful commit messages (#14)
- Tell the story: what, where, why
- "Fix bug" tells nothing
- Clear communication = senior behavior

## Automation & Process

**IF debating style** → Automate everything that can be automated (#15)
- Formatters and linters end debates
- CI/CD isn't optional
- Build safeguards into pipelines

**IF submitting PR** → Code reviews improve more than quality (#16)
- Share knowledge across team
- Keep PRs small and focused
- Build people, not just software

**IF learning** → Never stop learning and questioning (#17)
- Chase understanding, not new tech
- Learn fundamentals + adjacent skills
- Run toward the fire; that's where you grow

**IF stuck** → Ask for help when stuck (#18)
- Show what you've tried
- Provide context
- Asking good questions is a strength

## Estimates & Communication

**IF estimating** → Estimations are never true (#19)
- Communicate as ranges with confidence
- Include uncertainty
- Update early when estimates are off

## Production & Operations

**IF deploying** → You can't operate what you can't observe (#20)
- Log precisely, not excessively
- Instrument key metrics from the start
- Reliability matters more than features

**IF handling input** → Never trust user input (#21)
- Every input is potential attack vector
- Validate at the boundary
- Use parameterized queries, not strings

**IF error occurs** → Errors should fail loudly and immediately (#22)
- Silent failures = debugging nightmares
- Don't swallow exceptions
- Provide clear context about what failed

**IF optimizing** → Measure first, optimize second (#23)
- Profile to find actual bottlenecks
- Don't sacrifice clarity for micro-optimizations
- Know what you're optimizing for

## API Design & Architecture

**IF designing API** → Easy to use correctly, hard to misuse (#25)
- Use types to enforce constraints
- Make invalid states unrepresentable
- Good defaults + clear errors

**IF choosing patterns** → Favor composition over inheritance (#25b)
- More flexible, less coupling
- Each module = clear, focused purpose
- Maximize cohesion, minimize coupling

## Team & Culture

**IF working with others** → Be a good human (#26)
- Technical brilliance < collaboration skills
- Be kind, patient, share credit
- Build psychological safety
- Focus on fixing problems, not assigning blame

---

**For full details with examples:** Read `docs/ENGINEERING-PRINCIPLES.md`
