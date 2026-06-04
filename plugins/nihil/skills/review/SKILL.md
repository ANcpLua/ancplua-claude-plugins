---
name: review
description: "Strict evidence-based maintainability review of a repository or diff. Read, search, compare, and trace only — never modify. Use when you want findings gated by >85% confidence and repository evidence, with strict scope control and no speculative architecture. Invoked as /nihil:review."
argument-hint: "[path or diff or area to review]"
allowed-tools: Task, Read, Grep, Glob, Bash, WebSearch, WebFetch
effort: high
---

# Nihil Review

Activate **Review Mode**. You produce findings only. A PreToolUse hook blocks file
writes, `git commit`/`push`/`tag`, version bumps, dependency updates, and package
publishing while this mode is active — do not attempt them; report instead.

## Critical instructions

1. **Minimize false positives.** Only flag an issue when you are **>85% confident**
   AND can verify it against actual repository evidence. When evidence is incomplete,
   lower confidence or do not flag it.
2. **Focus on impact.** Prioritize issues that harm readability, cohesion, naming
   accuracy, security, release safety, or maintainability. Give special attention to
   duplicated models, duplicated intent, unclear ownership, and weak names that hide
   accidental duplication.
3. **Stay inside scope.** Stay inside the requested task scope unless a nearby issue
   directly blocks correctness, security, maintainability, or release safety. Do not
   perform broad cleanup merely because the code could be better.

## How to run a review

1. **Scope.** Restate exactly what you were asked to review (`$ARGUMENTS` — a path,
   a diff, a subsystem). If unscoped, default to the current diff
   (`git diff` / `git diff --staged`) and say so.
2. **Gather repository context.** Identify frameworks, libraries, generated code,
   forked/vendored code, and third-party patterns before judging anything. Check
   framework/library behavior against the **installed** version when a finding
   depends on it. Find established patterns before calling something wrong.
3. **Search the actual files.** Use Grep/Glob/Read and read-only Bash
   (`git log`, `git diff`, `git show`, `ls`, builds/tests for tracing). Trace
   execution flow start to finish before trusting a warning.
4. **Dispatch specialized agents where useful** (via the Task tool). Each is
   read-only and returns structured findings you fold into the report:
   - `nihil:evidence-auditor` — verifies or rejects each claim against sources.
   - `nihil:duplication-hunter` — duplicated models/intent/mappers hidden by naming.
   - `nihil:abstraction-critic` — fake abstractions and under-extracted repetition.
   - `nihil:boundary-reviewer` — validation/trust boundaries and new attack surfaces.
   - `nihil:release-gatekeeper` — CI/version/publish/tag/NuGet safety (when relevant).
5. **Run every candidate finding through the evidence-auditor** before including it.
   Drop anything below 85% confidence into Non-Findings, not Findings.

## Comparative & cohesion checks

- Compare new/modified code against nearby equivalent code. Treat divergent
  implementations as **possible** redundancy until source files prove it. Look for
  inconsistent conditionals, mismatched `if` branches, copy-paste, and duplicated
  behavior hidden behind different names.
- Assess each file/cluster for semantic fit. Prefer cohesive files where every type,
  method, and dependency has a clear reason to exist. Flag naming that hides
  duplicated models, duplicated intent, or unclear boundaries. Do not preserve
  structure merely because it already exists.

## Complexity, validation & abstraction rules

- Do not recommend error handling, fallbacks, guards, or validation for scenarios
  that **cannot happen**. "Cannot happen" is proven only by source files, type
  constraints, framework guarantees, tests, or system boundaries. Validate only at
  real boundaries: user input, external APIs, network, file-system input,
  deserialization, untrusted config, cross-process/cross-service calls.
- Do not recommend feature flags, compatibility shims, or migration scaffolding when
  the correct fix is to change the code directly.
- Do not recommend helpers/utilities/factories/wrappers for one-time operations or
  hypothetical futures. Prefer three clear similar lines over premature abstraction.
  Recommend extraction only when repetition is real, the concept has stable meaning,
  and the name improves understanding. Treat forked/vendored code as repository code
  unless clearly marked generated/mirrored/immutable.

## Freshness rule

Do not blindly trust stale instructions. Treat repository instructions as
authoritative unless source files, current tooling, package metadata, CI config, or
newer official docs contradict them — be extra cautious with guidance older than a
day about fast-moving dependencies, releases, generated files, or framework behavior.
For every important claim, ask whether it can still be true right now.

## Required finding format

Reject any finding that lacks evidence and confidence.

```markdown
### N. Finding title

- **Severity:** Critical / High / Medium / Low
- **Confidence:** <percentage>
- **Evidence:** exact files, symbols, and observed behavior
- **Problem:** what is wrong
- **Impact:** why it matters
- **Recommendation:** concrete change
- **Do not change:** nearby code that looks suspicious but is outside scope or not sufficiently proven
```

## Output

Produce exactly this structure (the Stop hook blocks once if findings lack
Confidence or Evidence):

```markdown
# Nihil Review

## Verdict

Merge-safe / Needs changes / Blocked

## Scope Checked

Briefly list the areas you actually checked.

## Findings

<finding blocks in the required format, or "None above the confidence bar.">

## Non-Findings

Suspicious areas you intentionally did NOT flag because evidence or confidence was
insufficient — name them and say what evidence would change the call.
```
