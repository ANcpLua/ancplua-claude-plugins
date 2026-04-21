# mutation-minded-testing

> Coverage is a floor. Mutation resistance is the signal.

A Claude Code plugin that rejects coverage-padding and TDD ritual in favour of
tests that actually catch bugs. Ships 4 agents and 4 skills oriented around a
single question:

> **If I mutated this line, would my test die?**

If no: the test is a cosmetic. Delete it or rewrite it.
If yes: the test earns its place in the suite.

## Install

This plugin ships via the `ancplua-claude-plugins` marketplace.

```text
/plugin
> install mutation-minded-testing from ancplua-claude-plugins
```

## Usage

Entry point: `/mmt [scope]`

`scope` is optional — a file, directory, or glob. If omitted, the command runs
against the current diff.

```text
/mmt src/users/UserService.ts
/mmt src/services/**/*.ts
/mmt                             # runs against git diff
```

The command orchestrates four phases:

1. **Architecture review** — is the code shape testable? Are there hidden
   dependencies, temporal coupling, or internal state that force weak tests?
2. **Test judgement** — grade each existing test on kill power. Verdicts:
   `STRONG`, `ACCEPTABLE`, `WEAK`, `KILL`.
3. **Test improvement** — rewrite `WEAK` tests. Rewrite or delete `KILL`
   tests. Leave `STRONG` tests alone.
4. **Branch closure** — fill remaining semantic-branch gaps with
   mutation-resistant tests only. Coverage as a side effect.

## What makes a test "strong"

A test is acceptable **only if at least one of these is true**:

- Distinguishes two semantically different outcomes (success vs failure,
  empty vs non-empty, auth vs unauth, cached vs uncached, valid vs invalid).
- Exercises a failure path with specific error-semantics assertions.
- Protects an invariant (no write on invalid input, no network call on null
  input, no selection change on unrelated delete).
- Verifies a state transition (before → during → after).
- Would plausibly fail under an operator or branch mutation.

Tests that only assert `toBeTruthy()`, `toBeDefined()`, `array.length === 1`,
"a mock was called", or a semantically empty snapshot are **rejected at judge
time**.

## Agents

| Agent | Role | Model |
|-------|------|-------|
| `architecture-reviewer` | Diagnose structural smells that produce weak tests | opus |
| `senior-tester-judge` | Grade tests on kill power, identify surviving mutations | opus |
| `expressive-verifier-improver` | Rewrite weak tests using a pattern catalogue | sonnet |
| `branch-coverage-implementer` | Drive end-to-end to 100% branch coverage with high-signal tests | sonnet |

## Skills

| Skill | When it triggers |
|-------|------------------|
| `reviewing-testability` | Tests are shallow because of the code shape |
| `judging-test-quality` | Auditing an existing suite before adding more tests |
| `improving-weak-tests` | Specific test asserts little or is implementation-coupled |
| `mutation-resistant-coverage` | Closing branch-coverage gaps without coverage cosmetics |

## What this plugin will NOT do

- Preach TDD or enforce red-green-refactor.
- Celebrate a coverage percentage.
- Generate tests whose only purpose is to hit uncovered lines.
- Add snapshot tests without semantic assertions.
- Write mock-heavy tests that couple to implementation details.

## License

MIT. See `LICENSE` at the repository root.
