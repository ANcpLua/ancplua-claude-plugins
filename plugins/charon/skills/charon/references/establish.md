# Establishing the ferry (first entry only)

Read this **once**, when `.claude/charon.local.md` does *not* yet exist — e.g. you were summoned
in plain English ("merge my PR", "babysit my PRs") with no `/charon` command run. A
natural-language start must converge on the *same* state and resume net as a slash start; this is
how. On every later iteration the state file already exists, so you never load this again.

## Resolve the target PR — first hit wins

1. A PR number / URL the user named in the request.
2. The **current branch's** PR — a bare `gh pr view` resolves it.
3. If the branch has none, **your** open PRs — exactly one → use it; several → **ask which**
   (an ask is *correct*; never ferry the wrong PR on a guess).
4. None resolvable → set `status: needs-you`, tell the user how to create one
   (offer `/commit-push-pr`), and stop. **Never invent a PR.**

```bash
gh pr view ${PR_HINT:-} --json number,headRefName,baseRefName,state,url,headRefOid \
  -q '{n:.number, head:.headRefName, base:.baseRefName, state:.state, url:.url, sha:.headRefOid}'
gh repo view --json nameWithOwner -q .nameWithOwner
# branch has no PR? list candidates instead:
#   gh pr list --author @me --state open --json number,title,headRefName,url
```

## Write the state file — exact schema

Write `.claude/charon.local.md` with the Write tool. The Stop hook reads it on every stop and
treats a missing / non-numeric `iteration` / `max_iterations`, or a missing prompt body, as
**corruption** and deletes it — so match this schema exactly. Leave `session_id` empty (the hook
claims it); `max_iterations` bounds **actionable** re-entries (CI waits are paced separately and
do not consume it).

```markdown
---
pr: <number>
repo: <owner/name>
url: <pr url>
base: <base branch>
head: <head branch>
head_sha: <head oid>
session_id:
iteration: 0
max_iterations: 40
status: working
started_at: <output of: date -u +%FT%TZ>
---
Continue ferrying PR #<number> (<owner/name>) to merge.

Invoke the `charon` skill and run exactly ONE iteration of the ferry loop: ground (one live
snapshot) → classify → dispatch one handler → update this file's `status:` and `head_sha:` →
end the turn. Never block, poll, or `gh pr checks --watch`.
```

This is the single "establish once" both entry points share — the `/charon:charon` command and a
plain-language summon converge here, so they can never drift apart.
