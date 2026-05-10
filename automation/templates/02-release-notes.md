# Automation 02 — Weekly release notes draft

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Draft weekly release notes from PRs merged in the last 7 days, across the 5 in-scope repos.

## Task-specific grounding

- Source: compute a portable cutoff first:
  ```bash
  if date -u -d '7 days ago' +%FT%TZ >/dev/null 2>&1; then
    cutoff="$(date -u -d '7 days ago' +%FT%TZ)"
  else
    cutoff="$(date -v-7d -u +%FT%TZ)"
  fi
  gh pr list --state merged --search "merged:>=$cutoff"
  ```
- Each entry: PR title, PR URL, one-line user-facing impact (or `internal:` prefix).
- Group by area inferred from labels and changed paths. Do not invent areas.
- Output is a **draft** — written to `docs/release-notes/<YYYY-WW>.md` per repo, never auto-merged.

## Scope

- **In:** PRs merged in the last 7 days.
- **Out:** open PRs, closed-without-merge PRs, raw commit-only diffs.

## Output

Per `policy.md`. The `Refs:` line lists the draft-note PR per repo, not the source PRs.
