---
name: mutation-resistant-coverage
description: Close branch gaps with high-signal specs, not cosmetics. Use when you run a file to 100% branches or kill survivors from Stryker/Infection/Pitest/Mutmut. Lists semantic branches and writes one real check per outcome. Triggers on "uncovered branches", "cover this file", "mutation run".
effort: high
---

# Mutation-Resistant Coverage

## Core principle

**Branches are not equal.** A branch where `success vs failure` changes
observable behavior is worth a test. A branch where two formatting outputs
differ by a whitespace is not. You enumerate semantically distinct
outcomes, write one high-signal test per outcome, and coverage falls out as
a side effect.

You never write a test whose only purpose is to enter a branch.

## When to invoke

- Pushing a file toward 100% branch coverage.
- A mutation-testing run (Stryker, Infection, Pitest, Mutmut) reports
  surviving mutants and you need to kill them.
- Opening a PR where the coverage gate demands more tests and you want to
  add them without producing cosmetics.

## Semantic branch taxonomy

Classify every condition in the target:

| Class | Example | Test required? |
|-------|---------|----------------|
| `success` vs `failure` | try/catch, `Result.Ok` / `Result.Err` | Yes, both sides |
| `empty` vs `non-empty` | `items.length === 0`, null collection | Yes, both sides |
| `valid` vs `invalid` | schema validation, type narrowing | Yes, both sides |
| `authorized` vs `unauthorized` | role / permission check | Yes, both sides |
| `cached` vs `uncached` | memoization, TTL expiry | Yes, both sides |
| `primary` vs `fallback` | network → cache, default → override | Yes, both sides |
| `new` vs `existing` | create vs update, insert vs upsert | Yes, both sides |
| `defensive` | guard where caller already enforces the invariant | Consider deleting the branch |
| `cosmetic` | whitespace-only format variants | No; one test is enough |

## Workflow

### Step 1 — Enumerate

Read the target file. Produce a branch map:

| Location | Branch | Class | Needs test? | Notes |
|----------|--------|-------|-------------|-------|
| `file.ts:42` | `items.length === 0` | empty/non-empty | yes | both sides |
| `file.ts:88` | `user.role === 'admin'` | auth/unauth | yes | both sides |
| `file.ts:104` | `if (!input)` | defensive | no | callers enforce; propose deletion |

### Step 2 — Audit existing tests per branch

For each `needs test = yes` row, find the existing test(s). Grade them with
the `judging-test-quality` rubric. A branch is "covered" only by a `STRONG`
or `ACCEPTABLE` test. `WEAK` or `KILL` does not count as coverage.

### Step 3 — Write the missing tests

Apply the patterns from `improving-weak-tests`. For every test, name the
mutation it catches (in the commit message, not as a comment in the test).

### Step 4 — Run coverage

Use the project's tool. Report **both** numbers:

- **Branch coverage %** — the floor.
- **Mutation score %** (if a tool is configured) — the signal.

### Step 5 — Remaining gaps

Any uncovered branch after step 4 falls into exactly one bucket:

| Bucket | Action |
|--------|--------|
| Architecturally blocked (no seam to reach it) | Hand to `reviewing-testability`. Do not paper over. |
| Dead defensive code | Propose deletion of the branch. |
| Genuinely unreachable | Mark with an exhaustive-check in the code (`assertNever`, pattern-match-all), not a test. |

## Hard rules

- Never write a test whose sole purpose is to enter a branch.
- Never count `WEAK`/`KILL` tests as coverage.
- Never suppress coverage or analyzer warnings to claim completion.
- Never leave a success branch covered without its failure sibling.
- Never celebrate a coverage percentage without the mutation score.

## If mutation testing is available

Run it. Examples of invocations:

- JS/TS: `npx stryker run`
- .NET: `dotnet stryker`
- PHP: `vendor/bin/infection`
- Python: `mutmut run`
- Java: `mvn org.pitest:pitest-maven:mutationCoverage`

Surviving mutants are your backlog. Each surviving mutant points at a test
that should have died and did not. Rewrite that test via
`improving-weak-tests`.

## Output

Three sections:

1. **Branch map** — the table from step 1.
2. **Tests added** — diff blocks per test, each naming the mutation caught.
3. **Remaining gaps** — table with bucket and action per remaining branch.

Final line in this exact shape:

```
Branch coverage: X% (up from Y%). Mutation score: P% (up from Q%). STRONG+ACCEPTABLE tests added: N. Architectural gaps: k. Dead-branch deletions proposed: m.
```

## Related

- Upstream cause of why branches are hard to cover: `reviewing-testability`.
- Grading existing tests: `judging-test-quality`.
- Rewriting individual weak tests: `improving-weak-tests`.
