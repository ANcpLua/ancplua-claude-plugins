# Automation 06 — Pre-tag verification

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Before the next release tag in any in-scope repo, verify changelog, migrations, feature flags, and tests.

## Task-specific grounding

Block tag if **any** of:

- `CHANGELOG.md` is missing an entry for the version about to be tagged.
- Pending DB migrations not applied in CI.
- Feature flags introduced but never flipped, or never removed (>30 days old).
- Tests fail, or changed-line coverage drops below 80% on the candidate commit.

Output verdict: **PASS** or **BLOCK**, with the exact failed gate.

## Scope

- **In:** the four gates above.
- **Out:** subjective "is this ready" judgments, code review verdicts, performance audits.

## Output

Per `policy.md`. `Blocked:` set when verdict is BLOCK; `Changed: none` otherwise.
