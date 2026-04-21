---
description: Run the mutation-minded testing workflow — architecture review, test judgement, weak-test rewrite, mutation-resistant branch closure — on a file, directory, or diff.
argument-hint: "[scope]"
allowed-tools: Task, Bash, Read, Grep, Glob, TodoWrite
effort: high
---

# /mmt — Mutation-Minded Testing

Runs the full behavior-first test-quality pass on `$ARGUMENTS` (a file,
directory, glob, or — if omitted — the current git diff).

**Coverage is a floor. Kill power is the signal.** This command will not
add tests whose only purpose is to raise a number.

## Scope resolution

- `$ARGUMENTS` empty → use `git diff --name-only` as the scope.
- `$ARGUMENTS` is a file or glob → use it.
- `$ARGUMENTS` is a directory → recurse into it.

If the scope contains no source files, stop and say so. Do not run the
workflow on an empty set.

## Phase 1 — Architecture review

Spawn the `architecture-reviewer` agent with the scope. Collect its ranked
list of structural smells that force weak tests.

**Gate:** if the reviewer returns findings ranked as blocking (a
structural issue that makes any mutation-resistant test impossible in the
target), pause the workflow and surface those findings first. Do not
proceed to write tests against a broken shape.

## Phase 2 — Test judgement

Spawn the `senior-tester-judge` agent with the scope. Collect per-test
verdicts (`STRONG` / `ACCEPTABLE` / `WEAK` / `KILL`) and the suite-level
triage table.

## Phase 3 — Test rewrite

Spawn the `expressive-verifier-improver` agent with the judge's `WEAK` and
`KILL` entries. Rewrites are applied to the files directly (agent has
`Edit` and `Write`). For each rewrite, the agent names the specific
mutation the new test catches.

If any test case cannot be rewritten without a structural change, the
agent hands it back to Phase 1 (architecture-reviewer) for that specific
seam.

## Phase 4 — Branch closure

Spawn the `branch-coverage-implementer` agent with the scope. It:

1. Enumerates semantic branches.
2. Confirms each is covered by a `STRONG` or `ACCEPTABLE` test from
   Phase 2 or 3.
3. Writes new high-signal tests for the gaps.
4. Runs the project's coverage (and mutation-testing tool if configured).
5. Reports remaining branches by bucket: architectural / dead-code /
   unreachable.

## Output

Produce a single summary at the end of Phase 4:

```markdown
## Mutation-Minded Testing — Summary

### Scope
<files / diff that was reviewed>

### Architecture findings
<top 3 smells with file:line, or "none">

### Suite triage (before → after)
| Action | Before | After |
|--------|--------|-------|
| STRONG | a₀ | a₁ |
| ACCEPTABLE | b₀ | b₁ |
| WEAK | c₀ | c₁ |
| KILL | d₀ | d₁ |

### Coverage
Branch coverage: X% (up from Y%).
Mutation score: P% (up from Q%), or "no mutation tool configured".

### Gaps remaining
<architectural / dead-code / unreachable — per bucket>

### Single weakest behavior after the pass
One sentence naming the behavior and the bug that could still ship.
```

## Hard rules (enforced across phases)

- No test is added whose only purpose is to enter a branch.
- No `toBeTruthy` / `toBeDefined` as the primary assertion.
- No `toHaveBeenCalled` alone — paired with specific args + state or not
  used.
- No `.length === N` without content assertion.
- No behavior left with only a positive-path test.
- No suppression of coverage or analyzer warnings to claim completion.

## When not to use this command

- The target has no tests yet and the team hasn't agreed on seams — run
  `reviewing-testability` as a skill first, manually, to set the shape.
- The target is throwaway code. Mutation-resistant tests are an
  investment; don't pay for code you're deleting this sprint.
