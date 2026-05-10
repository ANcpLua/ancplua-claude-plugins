# Cron Automation Policy

This policy governs the cron-triggered automations that maintain hygiene
across Alexander's working repositories. It is **not** for interactive dev
work — humans editing this repo should ignore everything under `automation/`.

## Grounding (every run)

This is not an audit and not a stale-label report. Each run rebuilds
decisions from current local git state, remotes, GitHub PRs, checks, review
threads, and local dirty files. Automation memory may help avoid repeating
recent manual work but is **not authority** for branch/PR decisions. Ignore
cached branch labels, prior chat summaries, and stale `AGENTS.md`/`CLAUDE.md`
conclusions as authority.

## Repos in scope

- `/Users/ancplua/qyl` → `github.com/Alexander-Nachtmann/qyl`
- `/Users/ancplua/framework/ANcpLua.Roslyn.Utilities` → `github.com/ANcpLua/ANcpLua.Roslyn.Utilities`
- `/Users/ancplua/framework/ANcpLua.NET.Sdk` → `github.com/ANcpLua/ANcpLua.NET.Sdk`
- `/Users/ancplua/framework/ANcpLua.Analyzers` → `github.com/ANcpLua/ANcpLua.Analyzers`
- `/Users/ancplua/framework/ANcpLua.Agents` → `github.com/ANcpLua/ANcpLua.Agents`

## Target state

- Each repo clean on default branch (always `main`).
- No stale local or remote branches.
- PRs are: fixed, pushed, merged, closed, deleted, or blocked **only** by
  exact missing permission/data.
- Destructive cleanup allowed when evidence supports it.
- No permission-asking during the run.
- No `git reset`.
- No completion claim without re-reading state after every action.

## Quick-gate (mandatory fast-exit)

1. Read automation memory.
2. Run `automation/scripts/quick-gate.sh <repo-path>`.
3. `NO_WORK=1` (exit 0) → stop. Emit one no-op result block via `log-entry.sh`.
4. `NO_WORK=0` (exit 10) → proceed to evidence pass.

Exit `10` means "work exists", not "helper failed". Any other non-zero exit
**is** a helper failure — investigate before proceeding.

## Live evidence (before any branch/PR action)

```bash
git rev-parse --show-toplevel
git remote -v
git status --short --branch
git fetch --all --prune --tags
git worktree list --porcelain
git remote show origin
git branch -vv --all
git for-each-ref --format='%(refname:short)%09%(objectname:short)%09%(committerdate:iso8601)%09%(authorname)%09%(upstream:short)' refs/heads refs/remotes
gh auth status
gh repo view --json nameWithOwner,defaultBranchRef,url
gh pr list --state all --limit 200 --json number,title,state,headRefName,baseRefName,author,updatedAt,mergedAt,closedAt,mergeStateStatus,reviewDecision,isDraft,url,headRefOid,baseRefOid,statusCheckRollup
gh pr view <n> --json files,commits,comments,reviews,reviewDecision,mergeStateStatus,statusCheckRollup,url,headRefName,baseRefName
gh api graphql   # for unresolved review/comment threads when gh pr view omits thread context
```

## Pre-action knowledge (per branch/PR)

- Local ref, remote ref, upstream, worktree owner.
- Last commit hash/date/author.
- Ahead/behind and merge-base vs default.
- PR URL/state, unresolved comments, latest checks, review decision, draft state, mergeability.
- Dirty files affecting the branch or PR.

## Action policy

- **Merged/landed** — delete local + remote branch after proof and worktree check.
- **Closed/superseded/dup/invalid** — close PR if needed; delete local + remote branches after proof from PR, commit, default-branch history.
- **Open and useful** — follow `pr-review-pass.md`; self-review full diff; read bot/agent/human comments; fix actionable issues; run verifier/tests; push. Merge only when live evidence says ready; match the repo's recent merge style.
- **Stale/orphan** — do **not** report a label and stop. Prove delete/close, or revive with a concrete branch/PR update. Block only on exact missing evidence/permission.
- **Dirty state blocks work** — inspect. Delete generated/stale residue, finish real work, stash only as last resort.
- **After every action** — re-read state, prove the intended result.

## Check-wait

- Never `gh pr checks --watch`.
- No polling, sleep, or repeated refresh from the automation.
- After push/update: one live `gh pr checks` snapshot.
- If queued/running/pending/not-scheduled → stop with `pushed-checks-running`; include PR URL, head SHA, check states.
- Push + running CI is **not** a reason to stay alive.

## Output (per repo, material results only)

```text
<repo: owner/name@branch>
Run:      <UTC ISO-8601> · <runner-sha>
Changed:  <successful commands/API effects, or "none">
Evidence: <hashes, PR URLs, check sources>
Refs:     <pushed: …, merged: PR#…, closed: …, deleted: …>
Blocked:  <real blocker only — omit if absent>
```

## RUN-LOG.md lifecycle

- File: `automation/RUN-LOG.md` (separate from project `CHANGELOG.md`).
- Line 1 banner: `<!-- AUTOMATED: cron runner artifact. Do not hand-edit. -->`
- Read before run (prior-state context).
- After run: prepend new entry via `automation/scripts/log-entry.sh`.
- Cap at 10 entries; FIFO eviction (drop oldest).
- No-op runs still write an entry (`Changed: none`) — a silent runner must be
  distinguishable from a dead one.
- Concurrency: serialize via `automation/.run-log.lock`; on conflict rebase + retry.

## Schedule

```text
FREQ=HOURLY;COUNT=24   # full pass
FREQ=HOURLY;COUNT=3    # light pass
WEEKLY                 # Mon 09:00 Europe/Vienna — 8-template bundle
```
