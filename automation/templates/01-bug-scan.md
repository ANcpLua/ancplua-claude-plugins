# Automation 01 — Daily bug scan

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Scan recent commits (since last run, or last 24 h) across the 5 in-scope repos
for likely bugs. Propose minimal fixes.

## Task-specific grounding

- Use **only** concrete repo evidence: SHAs, PRs, file paths, diffs, failing tests, CI signals.
- Do not invent bugs. If evidence is weak, say so and skip.
- Smallest safe fix; no refactors or unrelated cleanup.

## Scope

- **In:** recent commits, related diffs, failing tests touching the same code, CI logs from those commits.
- **Out:** speculative bugs, opportunistic refactors, dependency upgrades.

## Output

One result block per repo per the `policy.md` "Output" section, then append
the run via `automation/scripts/log-entry.sh`.
