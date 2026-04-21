---
name: reviewing-testability
description: Use when tests in a module feel shallow, hard to write, or require heavy mocking — diagnoses the structural causes (missing seams, hidden state, temporal coupling, over-broad public API, direct instantiation of collaborators) and proposes seam-level refactors. Triggers on "tests are brittle", "can't test this without mocks everywhere", "tests are too coupled to implementation", "why are these tests so weak", "mock-heavy test file".
effort: medium
---

# Reviewing Testability

## Core principle

Weak tests are usually a symptom of bad seams, not bad testers. If the only
way to observe an outcome is by mocking everything in sight or peeking at
private state, the architecture is forcing the weakness.

## When this skill applies

- A test file has more lines of mock setup than assertion.
- Tests break whenever the implementation is refactored without behavior
  changing.
- Tests pass when the code is mutated in plausible ways (the suite is
  permissive).
- You find yourself adding `resetForTesting()` or exposing internals "just
  for tests".
- `senior-tester-judge` returned many `WEAK` verdicts that trace to the
  same file.

## Diagnostic checklist

Walk the target module. For each of these, answer yes/no:

| Question | If yes, smell |
|----------|---------------|
| Does the unit under test `new` its collaborators directly? | Missing DI seam |
| Are decisions and side effects in the same function body? | Missing pure/impure split |
| Is there module-level or static state that leaks between tests? | Hidden state |
| Does the public API expose `getCache`, `_internal`, or `resetForTesting`? | Over-broad public surface |
| Do tests depend on the order of prior tests? | Temporal coupling |
| Are `Date.now()` / `DateTime.Now` / `new Date()` called directly? | Non-injectable clock |
| Does async completion have no observable signal from outside? | Fire-and-forget with no seam |
| Are static methods called on classes the test can't substitute? | Untestable statics |
| Do tests assert on internal counters or private maps? | Implementation peeking |

Each "yes" is a seam missing at a specific line. Name it, cite it, and
propose the narrowest refactor that introduces the seam.

## Refactor directions (narrowest-first)

- **Direct `new`** → constructor-inject an interface. Test passes a fake
  through the same door as production.
- **Decision + I/O tangled** → extract the decision as a pure function.
  Test the decision with a value; test the I/O orchestration with one test
  asserting the wiring.
- **Hidden state** → move to per-instance state. If it must be global,
  inject a reset hook that is **not public API** but is called by the test
  harness.
- **Direct clock** → inject `TimeProvider` / `() => Date` / `Clock`
  interface. Production uses `TimeProvider.System`; test uses a fake.
- **Fire-and-forget async** → return a promise, or expose a status
  property that transitions observably.
- **Statics** → wrap in an interface injected at construction.
- **Implementation peeking** → ask "what public outcome does this state
  represent?" If none, the state should not exist. If one exists, assert on
  the outcome instead.

## When to NOT refactor

- The code is third-party and you cannot modify it. Wrap it in an adapter
  interface; test the adapter's behavior only.
- The "smell" has no test consequence. If tests are strong and mutation-
  resistant despite the shape, leave it. Architecture is a means, not an
  end.
- The cost of the refactor exceeds the value. A one-line `Date.now()` fix
  is worth it; rewriting a 500-line legacy module to split decision from
  I/O might not be — hand that to a planned migration.

## What this skill will NOT tell you to do

- Apply SOLID broadly.
- Introduce abstractions that hide complexity rather than expose seams.
- Refactor code whose tests are already mutation-resistant.
- Add "testability hooks" that widen the public API.

## Output

When invoked as a skill-only reference, the reviewer (human or agent)
produces a ranked list of smells with:

1. Smell name and file:line.
2. The specific test weakness it forces (named mutation that survives).
3. The narrowest seam that fixes it.
4. What high-signal tests become possible after the fix.

Rank by **test-consequence severity**, not by refactor effort.

## Related

- For grading the tests themselves: see `judging-test-quality`.
- For rewriting specific weak tests: see `improving-weak-tests`.
- For end-to-end branch closure: see `mutation-resistant-coverage`.
