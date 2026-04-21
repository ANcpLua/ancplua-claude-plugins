# mutation-minded-testing

Behavior-first test quality stack. Rejects coverage-padding and TDD ritual.
Ships 4 agents and 4 skills focused on **kill power** — the probability that a
test would fail if the production code were mutated in a meaningful way.

## Core philosophy

**Coverage is a floor. Mutation resistance is the signal.**

A good test is not one that touches lines. A good test is one that **dies when
the code is broken**. The plugin treats every test as a hypothesis: "if this
operator flipped, this branch inverted, this error path silently swallowed —
would this test still pass?" If yes, the test is weak, regardless of coverage.

| Rejected framing | Preferred framing |
|------------------|-------------------|
| "Write tests first" | Write tests that would fail under plausible mutations |
| "Reach 80% coverage" | Close semantic-branch gaps; coverage is a minimum floor |
| "More tests = better" | Few sharp tests > many shallow tests |
| "Test that the function was called" | Test the behavioral contract and state transition |
| "Assert something is truthy" | Assert exact shape, transition, or invariant |

## What each agent does

| File | Agent | Role |
|------|-------|------|
| `agents/architecture-reviewer.md` | architecture-reviewer | Finds structural smells that force weak tests (god objects, hidden state, missing seams, implementation-coupled public APIs) |
| `agents/senior-tester-judge.md` | senior-tester-judge | Grades existing tests on kill power. Verdict per test: STRONG / ACCEPTABLE / WEAK / KILL |
| `agents/expressive-verifier-improver.md` | expressive-verifier-improver | Rewrites weak tests into mutation-resistant tests using a pattern catalogue |
| `agents/branch-coverage-implementer.md` | branch-coverage-implementer | Drives the full workflow to 100% branch coverage with mutation-resistant tests, never with cosmetic ones |

## What each skill does

| File | Skill | When it triggers |
|------|-------|------------------|
| `skills/reviewing-testability/SKILL.md` | reviewing-testability | When tests feel hard to write or tests are shallow because of the code shape |
| `skills/judging-test-quality/SKILL.md` | judging-test-quality | When auditing an existing test suite for kill power before adding more tests |
| `skills/improving-weak-tests/SKILL.md` | improving-weak-tests | When a specific test asserts little, uses `toBeTruthy`/`toBeDefined`, or only checks a call happened |
| `skills/mutation-resistant-coverage/SKILL.md` | mutation-resistant-coverage | When pushing a file or module to full branch coverage without producing coverage cosmetics |

## Workflow

The `/mmt` command runs the agents in sequence:

1. **architecture-reviewer** — is the code shape even testable well? Surface seams.
2. **senior-tester-judge** — grade the current suite; identify weak tests and surviving mutations.
3. **expressive-verifier-improver** — rewrite the weak ones.
4. **branch-coverage-implementer** — close remaining semantic-branch gaps with high-signal tests only.

Each phase feeds the next. The workflow refuses to add tests that would not
fail under a plausible mutation; coverage is reached as a side effect, not as
the target.

## Quality gate

A test is accepted only if **at least one** of these is true:

- It distinguishes two semantically different outcomes (success vs failure,
  empty vs non-empty, auth vs unauth, cached vs uncached, valid vs invalid).
- It exercises a failure path with a specific error-semantics assertion.
- It protects an invariant (no write on invalid input, no network call on null, no selection change on unrelated delete).
- It checks a state transition (before → during → after).
- It would plausibly fail under an operator or branch mutation (`>` → `>=`, `&&` → `||`, silent error swallowing, empty-as-success).

Tests that only assert `toBeTruthy`, `toBeDefined`, `.length === 1`, "a mock was
called", or a snapshot with no semantic content are **rejected at judge time**,
not at review time.

## Non-goals

- TDD preaching or red-green-refactor enforcement.
- Coverage percentage as a success metric.
- Generating "missing tests" purely to raise a number.
- Implementation-coupled tests (mock-heavy, internal-state-peeking).

## Notes

- Agents default to `opus` for judge and architecture reviewer, `sonnet` for
  the implementer/improver (cheaper bulk rewrites). Override per invocation
  as needed.
- Skills are `low`-to-`medium` effort; they are reference material loaded
  when triggered, not orchestrators.
- The plugin is language-agnostic. Examples lean TypeScript/C# because
  that's where the author ships; patterns port directly.
