# Engineering Principles

> **From Alexander:** These are lessons I've learned the hard way over years of software engineering.
> While some might seem obvious, they're easy to forget when you're deep in code.
> This document serves as a reference for all agents working in this codebase.

---

## 1. You're not paid to write code - you're paid to solve problems

Writing code is a means to an end, not the goal itself. Your value comes from understanding business
problems and delivering solutions that create value.

**Sometimes the best solution involves no code at all:**

- Maybe a process change would work better
- Maybe an existing tool could be configured differently
- Maybe the problem doesn't actually need solving

**Before implementation:**

- Take time to understand the real problem
- Work backward from the desired outcome
- Consider all possible approaches

---

## 2. There is no "best" solution, only trade-offs

Every choice has pros and cons. What works for one project might be terrible for another.

**Questions that have no universal answer:**

- Should you use microservices? *Depends on team size, scalability needs, operational complexity*
- Is NoSQL better than SQL? *Depends on data structure, query patterns, consistency requirements*
- Should you write tests first? *Depends on context, team expertise, project constraints*

**The experienced engineer:**

- Evaluates trade-offs based on current constraints
- Documents why they chose one option over another
- Always knows what they're optimizing for

**When stuck in circles evaluating trade-offs:**

- You haven't defined enough constraints
- Add more: budget, deadline, team size, acceptable technical debt, expected scale
- Clear constraints turn endless debates into clear decisions

---

## 3. Less code is better code

More code = more to maintain, test, debug, and more places for bugs to hide.

**Before adding code, ask:**

- Is this really needed?
- Can I solve this with existing code?
- Am I solving a problem I actually have, or one I think I might have?

**Remove unused code without hesitation:**

- Dead code creates confusion
- Increases maintenance burden
- Gives false sense of what the system actually does

---

## 4. Every dependency is a liability

Every dependency is a commitment to trust that library's quality, security, maintenance, and compatibility.

**Dependencies can:**

- Become abandoned
- Contain security vulnerabilities
- Break in subtle ways with updates
- Bring in transitive dependencies you never intended

**Best practices:**

- Regularly audit your dependencies
- Remove unused ones
- Evaluate project health (recent commits, active maintainers, security track record)
- Consider total cost of ownership, not just initial convenience

---

## 5. Ship early, iterate often

Perfect is the enemy of done. The longer you wait to ship, the longer you delay getting real user feedback.

**First make it work, then make it right, then make it fast.**

**Early releases help you:**

- Validate assumptions
- Discover what users actually need (vs. what you think they need)
- Course-correct before investing months in the wrong direction

**Don't wait for feedback until after you've built something:**

- User interviews, prototypes, mockups can validate ideas before writing code
- Sometimes a conversation reveals the feature you planned isn't what users need
- Build feedback loops into your development process

---

## 6. Design for change because software is never finished

There's no finish line in software. User needs evolve, technologies change, platforms update,
security vulnerabilities are discovered.

**Design for change:**

- Make it easy to modify, extend, and maintain
- Build with extensibility and clarity in mind
- Refactor continuously and incrementally rather than waiting for a "big rewrite"
- Balance YAGNI with thoughtful design that won't paint you into a corner
- Make changes reversible when possible

**The "set it and forget it" mindset leads to:**

- Technical debt
- Security risks
- Eventually, a complete rewrite

---

## 7. Write code for humans first, computers second

Code is read far more often than it's written. You might spend an hour writing a function, but dozens
of developers might read it hundreds of times over the years.

**Maintainability means:**

- Clear naming
- Simple logic
- Good structure
- Appropriate comments
- Choosing clarity over cleverness
- Choosing descriptive naming over explanatory comments
- Favoring explicit code over implicit magic

**Think about:**

- The developer who will debug this at 2 AM when production is down
- The new hire trying to understand the system six months from now
- Your future self who won't remember the context

---

## 8. Complexity kills projects - keep it simple

That clever abstraction you're proud of? That intricate design pattern? You'll regret it at 3 AM when
the system is down.

**Complexity has a cost:**

- Every abstraction layer makes the system harder to debug
- Every indirection makes it harder to reason about
- Every "flexible" design adds cognitive overhead

KISS: Keep It Simple, Stupid

- Prefer boring, straightforward solutions
- Build systems you can explain on a whiteboard
- Abstraction should hide complexity, not create it
- Respect the principle of least surprise

**Note:** Over-engineering is part of the developer journey. You have to go through it to appreciate
simplicity. But once you do, you'll never want to go back.

---

## 9. Fix root causes, not symptoms

When you find a bug, resist the urge to patch it with a quick fix. Band-aid solutions lead to brittle
systems with layers of patches stacked on patches.

**Find the root cause. Fix it properly.**

- Yes, it takes longer
- Yes, it might require refactoring
- But you'll prevent related bugs and build a more robust system

**Fixing a class of bugs at the root is far more efficient than repeatedly addressing individual symptoms.**

**See also:** The Five Whys technique — an iterative "why?" method for root-cause analysis.

---

## 10. Understand the "why" before moving on

When something isn't working or behaves differently than expected, don't just keep changing things
until it seems to work.

**"Trial and error until it works" is dangerous:**

- Leaves you with code you don't understand
- Potential bugs lurking beneath the surface
- Missed opportunities to learn

**Make sure you understand why it was behaving that way:**

- What assumption was wrong?
- What did you misunderstand about the framework, library, or language?
- What was the actual cause?

**Randomly changing things until something works is not debugging; it's hoping. And hope is not a strategy.**

---

## 11. Don't fall in love with your code

Your code is not your baby. It's not a reflection of your worth. It's a tool to solve a problem, and
if there's a better tool or better way, you should be willing to let it go.

**Being emotionally attached makes you:**

- Defensive in code reviews
- Resistant to change
- Blind to better solutions

**Good engineers:**

- Regularly delete their own code
- Refactor their designs
- Admit when their first approach wasn't the best
- Remove unused code without hesitation

---

## 12. Seek to understand before judging others' code

When you look at someone else's code, you see all the ways it's different from how you would have
written it.

**Before you judge, try to understand the context:**

- What constraints did they face?
- What requirements did they have?
- What was the codebase like when they started?

**Often, what seems like a poor decision makes sense when you understand the full story.**

**That said, if the code is truly problematic:**

- Focus on the code, not the developer
- Review code with empathy
- Suggest improvements respectfully
- Remember that your code will be someone else's "inherited mess" someday

---

## 13. Document the "why" behind your decisions

Six months from now, you won't remember why you chose this approach over that one. Neither will your
teammates. Neither will the new hire.

**Document important decisions:**

- Use Architecture Decision Records (ADRs), RFCs, comments, or design docs
- Explain the context, the options you considered, and why you chose this path
- It doesn't have to be formal, just enough to jog your memory later

**Good documentation captures:**

- The "why" behind non-obvious decisions
- The trade-offs you evaluated
- The constraints you were working with

**Example:**

> "We chose PostgreSQL over MongoDB because our data is highly relational, we need ACID transactions
> for financial records, and our team has 5 years of PostgreSQL experience but no MongoDB experience.
> We evaluated MongoDB but decided the learning curve and migration risk outweighed the benefits."

**Remember:** Documentation has a multiplier effect. An hour spent documenting can save dozens of
hours for your team.

---

## 14. Write meaningful commit messages and clear communication

Your commit history tells the story of your project. Good commit messages help you understand what
changed and why.

**Bad:** `fix bug`

**Good:** `Fix null reference in user service when optional phone number is missing`

**Clear communication applies to:**

- Commit messages
- Pull requests
- Tickets
- Documentation
- Code comments

**Keep pull requests small and manageable:**

- Easier to review
- Less likely to introduce bugs
- Clear communication is a hallmark of senior behavior

**Tip:** AI tools can help generate better commit messages, but always review and edit them for accuracy.

---

## 15. Automate everything that can be automated

Tabs vs. spaces. Braces on the same line or next line. These debates waste time and create friction.

**Establish coding standards early, automate enforcement, and move on.**

**Automation goes beyond formatting:**

- Testing
- Deployments
- Security scans
- Dependency updates
- Any repetitive task

**CI/CD isn't optional. It's the foundation of reliable software delivery.**

**Build pipelines with safeguards:**

- Automated rollbacks
- Comprehensive testing
- Bake times to reduce blast radius

**Forget about "it works on my machine". If it works in your automated pipeline, it works everywhere.**

---

## 16. Code reviews improve more than just quality

Code reviews aren't just about catching bugs. They're one of the best ways to share knowledge and
improve both the code and the people writing it.

**Benefits:**

- Junior developers learn patterns and practices
- Senior developers stay aware of what's happening
- Everyone learns about new areas
- Knowledge silos decrease
- Team becomes more resilient

**Keep pull requests small and manageable:**

- Easier to review thoroughly
- Less likely to introduce issues
- Focused, well-scoped PRs are easier to understand

**Review code with empathy - you're building people, not just software.**

---

## 17. Never stop learning and questioning assumptions

Technology moves fast. The frameworks, languages, and tools you know today will be different in five years.

**Continuous learning is non-negotiable.**

**Don't chase new tech; chase understanding:**

- Learn fundamentals: algorithms, data structures, networking, security, design principles
- Learn adjacent skills: communication, mentoring, project management
- Broad knowledge makes you a better developer

**Maintaining live production systems gives the best learnings:**

- Run toward the fire; this is where you grow
- Face hard problems
- Debug production incidents
- Learn from real-world constraints
- This is where theory meets reality

---

## 18. Ask for help when you're stuck

Being stuck for hours because you're too proud to ask is a waste. Your teammates want to help.

**Asking for help is a strength, not a weakness.**

**Ask good questions:**

- Show what you've tried
- Explain your current understanding
- Provide context

**Bad:** "My code doesn't work, help!"

**Good:** "I'm trying to connect to the API, but I'm getting a 401 error. I've verified the API key
is correct and the endpoint URL matches the documentation. Here's my code. Am I missing something
about the authentication flow?"

---

## 19. Estimations are never true - communicate as ranges

Estimation is hard. Really hard. There are always unknowns, unexpected complications, and tasks that
seemed simple but weren't.

**Treat estimates as educated guesses, not commitments:**

- Include uncertainty (ranges or confidence levels)
- Track estimates vs. actuals to improve
- Communicate early when an estimate was off

**Bad:** "This will take 3 days"

**Good:** "I estimate 3-5 days, assuming there are no issues with the third-party API integration,
which I haven't worked with before. I'll update you after my initial spike if I discover complications."

---

## 20. You can't operate what you can't observe

Production systems need visibility. Without proper observability, you're flying blind when things go wrong.

**Design systems with observability in mind from the start:**

- Log precisely, not excessively
- Add metrics, traces, and alarms that matter
- Track key metrics, performance, errors, user behavior

**Make sure you can answer:**

- Is the system healthy?
- Where are the bottlenecks?
- What's the user experience?
- When did this start failing?

**Operational excellence is the difference between:**

- Fixing issues in minutes vs. hours
- Knowing about problems before users do vs. learning from angry support tickets

**Reliability matters more than new features. Always.**

---

## 21. Never trust user input - validate and sanitize everything

Every input is a potential attack vector. Users make mistakes, typos happen, and malicious actors
actively try to break your system.

**Never trust user input:**

- Forms
- APIs
- File uploads
- URL parameters

**Validate all inputs at the boundary:**

- Check types, formats, ranges, allowed values
- Sanitize data to prevent injection attacks
- Use parameterized queries, encoding, established security libraries
- Don't roll your own security solutions

---

## 22. Errors should fail loudly and immediately

Silent failures are debugging nightmares. When something goes wrong, make it obvious.

**Fail fast, fail loud, provide clear error messages.**

**Don't:**

- Swallow exceptions
- Return null when something failed
- Log an error and continue as if nothing happened

**When a precondition isn't met, when data is invalid, when a required service is unavailable:**

- Stop execution
- Report the problem clearly
- Provide context about what went wrong and why
- Make it easy to trace the error to its source

**Good error handling saves hours of debugging time.**

---

## 23. Measure first, optimize second

Premature optimization is the root of much evil. Developers often spend time optimizing code that
isn't actually a bottleneck.

**Before optimizing:**

1. **Measure** - Profile your application
2. **Identify** - Find actual bottlenecks based on data, not intuition
3. **Optimize** - Fix those specific areas
4. **Measure again** - Verify improvement

**This doesn't mean ignore performance entirely:**

- Write reasonably efficient code from the start
- Don't sacrifice clarity and maintainability for micro-optimizations that don't matter
- Know what you're optimizing for: latency, throughput, memory, or development time

---

## 24. Change one thing at a time

When debugging or optimizing, resist the urge to change multiple things simultaneously.

**If you modify several things at once, you won't know which change actually worked.**

**Make one change, measure the result, then proceed:**

- This might feel slower initially
- But it saves time by giving clear cause-and-effect
- You'll build a mental model of what actually matters
- Avoid undoing a batch of changes because one broke something else

**This principle extends beyond debugging:**

- When refactoring: change structure OR behavior, not both
- When deploying: release one feature at a time
- When experimenting: vary one parameter, hold others constant

**Scientific method applies to software engineering.**

---

## 25. Design APIs that are easy to use correctly and hard to misuse

Good API design prevents bugs before they happen. Think about how it will be used and how it might
be misused.

**Best practices:**

- Use types to enforce constraints (required vs. optional, valid ranges, allowed states)
- Make invalid states unrepresentable
- Use clear naming that indicates purpose and behavior
- Provide good defaults
- Make common cases simple and complex cases possible
- Return meaningful errors that guide developers toward correct usage

**Favor composition over inheritance:**

- Composition is more flexible
- Creates fewer coupling issues
- Minimize coupling between components
- Maximize cohesion within them
- Each module should have a clear, focused purpose

---

## 26. Be a good human - it's more important than technical skills

Software engineering is a team sport. Technical brilliance means nothing if you're difficult to work with.

**Be kind. Be patient. Share credit. Admit mistakes. Help others grow.**

**Your attitude and collaboration skills matter more for your career than any technical skill.**

**Build psychological safety:**

- Where people feel comfortable asking questions
- Admitting they don't know something
- Raising concerns

**Example:**

When a teammate makes a mistake that causes a production issue:

- Focus on fixing the problem and preventing it from happening again
- Ask "How can we improve our process?" instead of "Why did you do that?"
- This builds trust and encourages people to report problems early instead of hiding them

**Review code with empathy. Communicate trade-offs clearly. Support your teammates. Celebrate their successes.**

---

## Conclusion

These principles aren't strict laws. They're guidelines based on experience, mistakes, and lessons learned.

**Take what resonates with you, adapt it to your context.**

**The best engineers aren't those who write the most clever code. They're the ones who:**

- Deliver value
- Collaborate effectively
- Learn continuously
- Make everyone around them better

**Every project, every team, and every challenge will teach you something new. Keep learning. Keep growing. Keep building.**

---

"We are building this together. When you learn something non-obvious, add it here so future changes go faster." - Alexander
