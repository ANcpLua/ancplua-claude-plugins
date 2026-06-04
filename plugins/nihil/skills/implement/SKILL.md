---
name: implement
description: "Implement evidence-backed Nihil findings within a fixed scope, preserving behavior unless authorized. Modifies only scoped files and runs checks before claiming done. Blocks push/tag/publish/version-bump (those belong to release). Use after /nihil:review to apply findings. Invoked as /nihil:implement."
argument-hint: "[findings or scope to implement]"
allowed-tools: Task, Read, Edit, Write, MultiEdit, Grep, Glob, Bash
effort: high
---

# Nihil Implementation

Activate **Implementation Mode**. You may modify files inside the requested scope. A
PreToolUse hook blocks `git push`, `git tag`, package publishing, version bumps, and
obviously destructive shell while this mode is active — those are release steps; use
`/nihil:release`. `git commit` is allowed but not required.

## Critical instructions

1. **Evidence before change.** Implement only findings backed by repository evidence.
   If a finding lacks evidence, do not implement it — go back to `/nihil:review`.
2. **Scope discipline.** Modify only the files the task names or that the finding's
   evidence directly implicates. Do not perform broad refactors or opportunistic
   cleanup. Prefer three clear similar lines over a premature abstraction; extract
   only when repetition is real and the name improves understanding.
3. **Preserve behavior** unless the task explicitly authorizes a behavior change.

## Sequence

For each finding, follow:

```text
Finding → Evidence → Change → Check
```

1. **Finding.** State the finding and its evidence (files/symbols).
2. **Change.** Make the minimal correct edit. Do not add error handling, fallbacks,
   guards, or validation for scenarios that cannot happen (proven only by source,
   types, framework guarantees, tests, or boundaries). Validate only at real
   boundaries. No feature flags, compatibility shims, or migration scaffolding when
   the correct fix is to change the code directly.
3. **Check.** Run the relevant checks — build, tests, or run the artifact — and
   compare against a baseline you captured before editing. Do not report a failure
   you caused as preexisting.

Use specialized read-only agents (`nihil:duplication-hunter`,
`nihil:abstraction-critic`, `nihil:boundary-reviewer`, `nihil:evidence-auditor`) via
the Task tool to confirm a change is correct and in-scope when uncertain.

## Output

Produce exactly this structure (the Stop hook blocks once if a Verification section
is missing):

```markdown
# Nihil Implementation

## Implemented Findings

<each finding implemented, with the evidence that justified it>

## Changed Files

<exact files changed and why>

## Verification

<checks you ran (build/tests/run), their output, and the baseline you compared to>

## Remaining Risks

<anything not fully verified, out-of-scope follow-ups, or assumptions made>
```
