# Automation 03 — CI failure summary

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Summarize CI failures and flaky tests from the last 24 h across the 5 in-scope repos.

## Task-specific grounding

- Source: `gh run list --limit 50` then `gh run view <id> --log-failed` for failures.
- **Flaky** = same test failed then passed without code change between runs.
- **Top fix** = highest-frequency failure with a clear cause in the log.
- Group by likely root cause. One paragraph per cause, link to a representative failing run.

## Scope

- **In:** runs in the last ~24 h on required workflows.
- **Out:** succeeded runs, runs from non-required workflows, manual reruns.

## Output

Per `policy.md`. `Changed: none` unless an obvious one-line fix is shipped
(e.g. flaky test marked `[Retry]`, missing dep added to CI image).
