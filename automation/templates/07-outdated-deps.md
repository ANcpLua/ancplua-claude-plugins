# Automation 07 — Outdated deps with safe upgrades

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Scan outdated dependencies across the 5 in-scope repos. Propose safe upgrades with minimal changes.

## Task-specific grounding

- **Safe** = patch or minor with no breaking-change notes in the package's release notes.
- **Minimal** = one PR per repo bumping a coherent set; no unrelated edits.
- **Skip:** majors, prereleases, packages with open advisories not addressed in this pass.
- Coordinate with `Automation 04 — Dependency drift` to avoid double bumps.

## Scope

- **In:** direct deps in `*.csproj` / `Directory.Packages.props`.
- **Out:** transitive bumps, dev-only tooling, container base images, GitHub Actions versions.

## Output

Per `policy.md`. `Refs:` lists the draft PR URL per repo if upgrades land; otherwise
analysis-only block with `Changed: none`.
