# Establishing the ferry (first entry only)

Read this **once**, on first entry — e.g. you were summoned in plain English ("merge my PR",
"babysit my PRs") with no `/charon:charon` command run, or a state file exists but the user named a
*different* PR. A natural-language start must converge on the *same* state and resume net as a slash
start; this is how. On every later iteration for the *same* PR the state file already exists, so you
never load this again.

`PR_HINT` below is the PR number / URL the user named (empty ⇒ resolve from the current branch).

## Fleet lookout? Skip the solo state file entirely

If you were invoked **as a `charon:lookout`** (the ferryman handed you one PR in a fleet), do **not**
write `.claude/charon.local.md` and do **not** read this ladder. Fleet mode is a live orchestration
that deliberately forgoes the solo Stop-hook/state-file resume net (see `commands/charon.md` Fleet
and `agents/lookout.md`); a lookout-written solo state file would collide with the ferryman's
orchestration. Work your single assigned PR directly — track `status`/`head_sha` in your own turn
and report each transition via SendMessage — and ignore everything below. The rest of this file is
for the **solo** ferry only.

## Resolve the target PR — first hit wins

1. **A PR number / URL the user explicitly named in the request** — this wins even if
   `.claude/charon.local.md` already exists for a *different* PR (the user is redirecting the ferry):
   (re-)establish the state file for the named PR, overwriting any prior one.
2. Else, if `.claude/charon.local.md` already exists → use its `pr:` (the in-flight ferry).
3. Else, the **current branch's** PR — a bare `gh pr view` resolves it.
4. Else, **your** open PRs — exactly one → use it; several → **ask which**
   (an ask is *correct*; never ferry the wrong PR on a guess).
5. None resolvable → set `status: needs-you`, tell the user how to create one
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

This is the single "establish once" the solo entry points share — the `/charon:charon` command and a
plain-language summon converge here, so they can never drift apart.
