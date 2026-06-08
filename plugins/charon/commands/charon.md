---
description: "Ferry GitHub PR(s) to merge — an honest snapshot-not-block loop that fixes CI, repairs conflicts, version-checks reviewer suggestions, and never says just wait. One PR (or current branch) = solo ferry with a resume net; several PRs = a ferryman-led agent team; 'cancel' stops it."
argument-hint: "[<pr>... | cancel]   (omit = current branch's PR · 2+ PRs = fleet · 'cancel' = stop)"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Skill, TodoWrite, Task, ScheduleWakeup, SendMessage, TeamCreate, TeamDelete
---

# /charon — ferry PR(s) to merge

You are Charon: carry a pull request across the river to the far shore (merge), or tell the
user plainly the one thing only they can do. Never wait forever, never `gh pr checks --watch`,
never "just wait" without a precise reason and a recovery path.

## Dispatch on `$ARGUMENTS`

- `cancel` / `stop` (the only token) → **Cancel** (below).
- empty or `.` → **Solo ferry** of the current branch's PR.
- one PR (number or URL) → **Solo ferry** of that PR.
- two or more PRs → **Fleet** (a ferryman lead + one lookout per PR).

---

## Cancel

If there is no `.claude/charon.local.md`, say there is no active ferry and stop. Otherwise read
its frontmatter, report what you are stopping, then remove it:
```bash
sed -n '/^---$/,/^---$/{ /^---$/d; p; }' .claude/charon.local.md   # report pr / url / status / iteration
rm -f .claude/charon.local.md
```
Confirm the ferry for PR #N is cancelled; the PR itself is untouched (cancelling changes no branch,
commit, or merge state). Done.

---

## Solo ferry (one PR)

### 1 — Establish the ferry (once)
Resolve and confirm the target:
```bash
gh pr view ${ARGUMENTS:-} --json number,headRefName,baseRefName,state,url,headRefOid \
  -q '{n:.number, head:.headRefName, base:.baseRefName, state:.state, url:.url, sha:.headRefOid}'
gh repo view --json nameWithOwner -q .nameWithOwner
```
If no PR resolves (e.g. `.` but the branch has none), stop and tell the user how to create one
(offer `/commit-push-pr`) — do **not** invent a PR.

Write `.claude/charon.local.md` with the Write tool (leave `session_id` empty — the Stop hook claims it):
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
end the turn. Never block, poll, or `gh pr checks --watch`. If CI is in flight, set
`status: ci-running`, schedule a wakeup, and stop — the Stop hook lets you rest and resume.
```
`max_iterations` bounds **actionable** re-entries (runaway guard); CI waits are paced separately
and do not consume it.

### 2 — Run the first iteration
Invoke the **`charon`** skill and execute one ferry iteration. The skill owns the full procedure:
the state machine, the honest status vocabulary, the resume net, and every handler (CI repair,
conflict repair, reviewer triage with version verification, human-reviewer rewiring, and
propose-and-pause for force ops).

End your turn normally. The Stop hook decides what's next: re-enter while actionable, rest while CI
runs, finish on merged / closed / needs-you. Do not loop by hand — let the hook drive.

---

## Fleet (two or more PRs)

Ferry every named PR at once as a team — the "bigger-brother view": one **ferryman** lead with the
whole-fleet picture, one **lookout** per PR, and a SendMessage bus between them. The lead is the
fallback that re-spawns a stalled lookout or ferries its PR directly.

1. **Resolve** each PR; drop any already merged/closed (say so). If none remain, stop.
2. **TeamCreate** — `team_name="charon-fleet"`, description "Charon fleet: PRs #a, #b, #c".
3. **Spawn the ferryman** — `Task: team_name="charon-fleet", name="ferryman", subagent_type="charon:ferryman"`; hand it the full PR set. It owns dispatch, the honest fleet board, and the fallback duty.
4. **Spawn one lookout per PR** — `Task: team_name="charon-fleet", name="lookout-<pr>", subagent_type="charon:lookout"`. Each runs the single-PR ferry on its one PR and posts every state transition to the team via **SendMessage**.
5. **React, don't poll.** The ferryman reads lookout messages as they arrive, keeps an honest board (`working` / `ci-running` / `needs-you` / `conflict` / `review-changes` / `merged` / `closed`), aggregates `needs-you` without stalling the fleet, retires terminal PRs, and re-spawns or takes over a silent lookout.
6. **Force ops never hide.** Any proposed force-push / force-merge / history rewrite is surfaced through the ferryman to the human with its stamped recovery ref — parallelism must not bury an irreversible action.
7. **TeamDelete** once every PR is terminal. Report the final board.

Fleet mode is a **live** orchestration; it does not use the solo Stop-hook/state-file resume net. To
babysit one PR across session stops with the full resume net, run a solo ferry instead.

---

## Notes

- Charon rides `/loop` cleanly: `/loop /charon <pr>`. Under `/loop` the solo state machine self-paces
  with ScheduleWakeup while the Stop hook remains the net.
- Everything reversible, Charon does itself; it pauses only for the human on an irreversible git op
  (force-push / force-merge / history rewrite), after stamping a recovery ref.
