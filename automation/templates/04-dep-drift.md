# Automation 04 — Dependency / SDK drift detection

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Detect dependency and SDK drift across the 5 in-scope repos. Propose a minimal alignment plan.

## Task-specific grounding

- Sources per repo: `global.json` (`sdk.version`), `Directory.Packages.props`, `*.csproj`.
- **Drift** = same package at different versions across repos, **or** a repo lagging public stable by >1 minor.
- **Minimal alignment** = bump only what's needed for compat. No major version jumps in this pass.
- Cross-reference NuGet for the latest stable version per package.

## Scope

- **In:** direct package references and SDK pins across the 5 repos.
- **Out:** transitive resolutions, prerelease packages, CI-tooling versions, container base images.

## Output

Per `policy.md`. If proposed bumps stay safe (patch/minor with clean release notes), open
a draft PR per repo via `$yeet`. Otherwise emit an analysis-only block with `Changed: none`.
