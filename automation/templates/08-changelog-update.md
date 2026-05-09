# Automation 08 — Weekly CHANGELOG.md update

Read `automation/policy.md` and follow its **grounding**, **quick-gate**, **evidence**, **action**, **check-wait**, and **output** rules.

## Task

Update each in-scope repo's `CHANGELOG.md` with this week's highlights and key PR links.

## Task-specific grounding

- This **only** edits each repo's project `CHANGELOG.md`. The cron runner's own log lives at
  `automation/RUN-LOG.md` — they are separate files, do not conflate.
- Source: compute a portable cutoff first:
  ```bash
  if date -u -d '7 days ago' +%FT%TZ >/dev/null 2>&1; then
    cutoff="$(date -u -d '7 days ago' +%FT%TZ)"
  else
    cutoff="$(date -v-7d -u +%FT%TZ)"
  fi
  gh pr list --state merged --search "merged:>=$cutoff"
  ```
- Pick top 3-5 PRs per repo by user-facing impact. Link the PR.
- Respect each repo's `CHANGELOG.md` format (Keep-A-Changelog conventions are common).
  Prepend a new section under `## [Unreleased]` with a date heading; do not destructively rewrite.
- Repo `CHANGELOG.md` is human-curated — do **not** apply FIFO eviction there. The cap-10 FIFO
  rule applies only to `automation/RUN-LOG.md`.

## Scope

- **In:** PRs merged in the last 7 days, per repo.
- **Out:** in-progress work, internal-only refactors with no user impact.

## Output

Per `policy.md`. `Refs:` lists the CHANGELOG-updating PR per repo (or commit hash
if main accepts direct pushes for changelog updates).
