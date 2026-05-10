# Automation 05 — Untested-paths drafts via $yeet

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Identify untested paths from changes merged in the last 7 days. Add focused
tests and open draft PRs via `$yeet`.

## Task-specific grounding

- Tooling: `dotnet test --collect "XPlat Code Coverage"` → cobertura → changed-line coverage.
- **Untested** = lines/branches in recent diffs without coverage in the existing test project.
- One draft PR per repo. `$yeet` body lists the changed-line files and the added tests.
- Tests must add **kill power** — see the `mutation-minded-testing` plugin for the rubric. No
  `toBeTruthy`/`toBeDefined` as primary assertions. No happy-path-only coverage.

## Scope

- **In:** lines added in PRs merged in the last 7 days.
- **Out:** untouched legacy code, generated files, integration boundaries without ports.

## Output

Per `policy.md`. `Refs:` lists the draft PR URL per repo.
