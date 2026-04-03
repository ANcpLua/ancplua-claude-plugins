---
name: qyl-audit
description: Audit qyl for compatibility drift, plane violations, generator/runtime mismatches, workflow-shape problems, policy gaps, and migration blockers by inspecting the repo directly.
---

# qyl-audit

`qyl-audit` is a strict repo audit skill.

It compares `declared repo truth` with `observed repo state`.

It is not a general architecture advisor.
It is not a runtime subsystem.
It is a read-only audit procedure.

## Use this skill when

Use this skill when the user asks to:

- audit qyl architecture
- detect drift
- verify plane boundaries
- check generator/runtime parity
- validate version/API assumptions
- inspect workflow/orchestrator shape
- find migration blockers
- decide whether old code is safe to delete

## Read first

Always start with the minimum repo truth surface:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/AGENTS.md`
- `.claude/planes/*.md`
- `CHANGELOG.md`
- `Version.props`

Then read only the project and source files needed for the requested audit mode.

Use the reference files in `references/` for audit rules and compatibility facts.

## Audit modes

### Default
If no mode is given, run all of these:

- compatibility
- planes
- generator
- workflow
- policy
- migration

### `compat`
Check package/API truth against actual usage.

Read:
- `Version.props`
- relevant `*.csproj`
- runtime bridge code
- generator/runtime usage sites

Use:
- `references/compatibility.md`

### `planes`
Check seven-plane boundary violations and instruction-surface consistency.

Read:
- `.claude/AGENTS.md`
- `.claude/planes/*.md`
- root `AGENTS.md`
- root `CLAUDE.md`
- relevant project/source files

Use:
- `references/planes.md`
- `references/repo-map.md`

### `generator`
Check Loom model -> emitted output -> runtime bridge parity.

Read:
- `src/qyl.instrumentation.generators/Loom/**`
- `src/qyl.instrumentation/Instrumentation/Loom/**`
- generated `.g.cs` outputs if present

Use:
- `references/generator-runtime.md`

### `workflow`
Check whether orchestration follows the intended MAF shape.

Read:
- `src/qyl.loom/**`
- `src/qyl.collector/Autofix/**`
- any V2 workflow/runtime files
- hosting/background-service entrypoints relevant to Loom/autofix

Use:
- `references/workflow-shape.md`

### `policy`
Check capability and approval coverage.

Read:
- tool attributes
- runtime bridge metadata
- workflow gate paths
- destructive action paths

Use:
- `references/policy-gates.md`

### `migration`
Check whether old paths can be removed.

Read:
- `CHANGELOG.md`
- old path references
- new path references
- replacement wiring

Use:
- `references/migration.md`

## Compatibility knowledge

Treat compatibility facts as embedded audit knowledge, verified against repo versions.

Examples of valid built-in facts:

- `.NET 10` `AIFunctionFactoryOptions` is the preferred Loom tool bridge path
- `ConfigureParameterBinding`, `MarshalResult`, and `ExcludeResultSchema` are the important `.NET 10` bridge features
- MAF hosting/session assumptions must match the versions and rules already recorded in the repo
- fresh workflow per run is the safe default
- session IDs or conversation IDs do not imply shared memory

Do not invent new compatibility facts from memory if the repo version surface can be checked directly.

## Migration knowledge

Migration state is not hardcoded.

Derive it live from:
- `CHANGELOG.md`
- instruction files
- source files
- project references
- generator/runtime code
- actual consumers of old and new paths

## Output format

Return a plain markdown report.

Do not invent JSON schemas or custom data envelopes unless the user explicitly asks for them.

Use this section order when relevant:

## Findings

List findings first, ordered by severity.

Each finding should include:
- short category
- exact file references
- declared truth
- observed truth
- concrete fix direction

## Evidence

List the exact files that support the findings.

## What is blocked

List the missing conditions that prevent cleanup, migration, or deletion.

## Safe deletions

Only list items here if:
- a replacement exists
- the replacement is actually wired
- the old path has no remaining consumers

If any of those are false, do not list it as safe.

## Summary

Include:
- total findings
- major blockers
- safe deletions count

## Severity rules

### Error
Use when:
- a hard plane rule is violated
- runtime/generator mismatch breaks the intended architecture path
- version/API assumptions are wrong
- destructive behavior lacks required gating
- migration claims are false in code

### Warning
Use when:
- old and new paths coexist unsafely
- replacement exists but is incomplete
- architecture drift is real but not immediately breaking
- deletion is only conditionally safe

### Info
Use when:
- cleanup opportunity exists
- a path is still transitional but expected
- a rule is satisfied and worth calling out

## Guardrails

- findings first
- exact file references only
- no vague "smell" language
- no speculative claims without evidence
- no "safe to delete" without checking consumers and replacement
- no builds/tests unless explicitly requested
- keep the report concise and factual

## Repo-specific focus

Prioritize these qyl surfaces when relevant:

- `src/qyl.collector`
- `src/qyl.contracts`
- `src/qyl.instrumentation`
- `src/qyl.instrumentation.generators`
- `src/qyl.loom`
- `src/qyl.mcp`
- `.claude/planes`
- `CHANGELOG.md`
- `Version.props`

## Reference files

Load only what is needed:

- `references/compatibility.md`
- `references/planes.md`
- `references/generator-runtime.md`
- `references/workflow-shape.md`
- `references/policy-gates.md`
- `references/migration.md`
- `references/repo-map.md`
