---
name: judging-test-quality
description: Use when auditing an existing test suite for kill power before writing more tests — not before touching code. Applies a mutation-minded rubric to grade each test (STRONG/ACCEPTABLE/WEAK/KILL), names at least one plausible mutation each test would survive, and flags cosmetic assertions. Triggers on "audit these tests", "are these tests any good", "how strong is this suite", "mutation score", "test quality review", "tests pass but code is buggy".
effort: medium
---

# Judging Test Quality

## Core principle

A test's value is not "it passes". A test's value is **"it would fail if the
code were broken in a realistic way"**. Coverage is not evidence. Green is
not evidence. The only evidence is mutation resistance.

## When to invoke this skill

- Before writing new tests in an area — know the existing baseline first.
- After a bug ships that the suite "should have caught".
- When a test file has 100% coverage but users still report regressions.
- When onboarding to a module and the suite feels suspicious.

## The rubric

For every test, assign exactly one verdict:

| Verdict | Criterion |
|---------|-----------|
| `STRONG` | Would die under multiple plausible mutations. Asserts exact semantic effects. Tests a contract. |
| `ACCEPTABLE` | Would die under at least one plausible mutation. Assertions are specific enough to have meaning. |
| `WEAK` | Survives common mutations. Assertions are vague, happy-path-only, or implementation-coupled. |
| `KILL` | Actively misleading. Asserts nothing meaningful or only internal mechanics. Delete or rewrite from scratch. |

No "borderline" verdicts. When unsure between two, pick the lower.

## The mutation checklist

For each test, ask: **would this test fail if any of these mutations were
applied to the production code?**

- `>` → `>=`, `<` → `<=`, `==` → `!=`
- `&&` → `||`
- `true` → `false` as a literal
- Remove a `throw`; return `null` / default instead
- Return empty collection instead of the real result
- Silently swallow an error (`catch {}`)
- Skip a side effect (no reload after save, no selection update after delete)
- Invert a guard
- Off-by-one in a slice or range
- Return the input instead of the computed result
- Reorder two side effects that must run in a specific order

## Automatic downgrades

A test earns at most `WEAK` if **any** of these apply:

- Primary assertion is `toBeTruthy()`, `toBeDefined()`, `toBeFalsy()`, or
  `not.toBeNull()` with no follow-up shape check.
- Primary assertion is `array.length === N` with no content check.
- Primary assertion is `mock.toHaveBeenCalled()` without
  `toHaveBeenCalledWith(specific)` **and** an external state or output
  check.
- Snapshot without a hand-crafted structural assertion alongside it.
- Test name is "should work" / "should be defined" / "should render".
- Only the happy path; no failure-path sibling exists for the behavior.
- Asserts on private state, internal caches, or impl-only helpers.

## Negative-space rule

A behavior is not fully tested unless **at least one** test asserts what
must NOT happen:

- `save` with invalid input → no HTTP write fires.
- `load` error → existing selection is not silently overwritten.
- `delete non-selected item` → current selection unchanged.
- `null input` → no network call.
- `malformed data` → no crash; typed fallback returned.

A behavior with a positive-path test and no negative-space counterpart is
incomplete, even if the positive test is `ACCEPTABLE`.

## Output shape

For each file:

```markdown
## `path/to/file.spec.ts`

### Summary
Total: N · STRONG: a · ACCEPTABLE: b · WEAK: c · KILL: d
Behaviors missing negative-space: [list]

### Verdicts
<one entry per test with: verdict, surviving mutation, recommendation>
```

End with a suite-level triage table and one sentence naming the single
weakest behavior — the one where a realistic production bug would ship
undetected.

## What this skill will NOT do

- Suggest specific new assertions — hand those to `improving-weak-tests`.
- Write replacement tests — hand those to the `expressive-verifier-improver`
  agent.
- Celebrate high coverage without a mutation-resistance check.
- Grade tests against implementation details ("does this test cover every
  branch in the function").

## Related

- For the upstream cause of weak tests: see `reviewing-testability`.
- For rewriting specific weak tests: see `improving-weak-tests`.
- For end-to-end coverage closure: see `mutation-resistant-coverage`.
