---
description: Audit qyl for compatibility drift, plane violations, generator/runtime mismatches, workflow-shape problems, policy gaps, and migration blockers
argument-hint: "[compat | planes | generator | workflow | policy | migration]"
effort: medium
---

# /qyl:audit

Audit qyl against its own declared architecture, runtime constraints, generator/runtime parity, policy gates, and migration state.

## Usage

- `/qyl:audit`
- `/qyl:audit compat`
- `/qyl:audit planes`
- `/qyl:audit generator`
- `/qyl:audit workflow`
- `/qyl:audit policy`
- `/qyl:audit migration`

## Modes

- `compat`
  - check package/API reality against actual usage

- `planes`
  - check seven-plane boundary violations and instruction-surface consistency

- `generator`
  - check Loom model -> emitter -> runtime bridge parity

- `workflow`
  - check workflow/orchestrator shape and MAF boundary correctness

- `policy`
  - check capability, approval, and destructive-action coverage

- `migration`
  - check old vs new paths, blockers, and safe deletion readiness

## Output

Return a strict markdown report with these sections when relevant:

1. `Findings`
2. `Evidence`
3. `What is blocked`
4. `Safe deletions`
5. `Summary`

## Rules

- findings first
- use exact file references
- do not invent facts not supported by repo evidence
- do not call something safe to delete unless replacement exists and the old path has no remaining consumers
- do not run builds or tests unless explicitly requested

Use the `qyl-audit` skill to perform the audit.
