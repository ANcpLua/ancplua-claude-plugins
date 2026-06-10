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

## Solo ferry (one PR or current branch)

Invoke the **`charon`** skill and run exactly ONE iteration — pass the user's `$ARGUMENTS`
through as the PR hint (a number / URL; `.` or empty = current branch). The skill owns the whole
procedure, **including establishing the ferry on first entry**: it resolves the target PR (from
your hint, the current branch, or your open PRs — asking only when genuinely ambiguous), writes
`.claude/charon.local.md` if it does not exist yet (the exact schema the resume net needs, with
`max_iterations` bounding actionable re-entries), then grounds → classifies → dispatches one
handler → writes an honest `status:`.

If no PR resolves (e.g. `.` but the branch has none), the skill stops with `status: needs-you`
and tells the user how to create one (`/commit-push-pr`) — it never invents a PR.

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
4. **Spawn one lookout per PR** — `Task: team_name="charon-fleet", name="lookout-<pr>", subagent_type="charon:lookout"`. Each runs the single-PR ferry on its one PR and posts every state transition to the team via **SendMessage**. A lookout works its PR directly and does **not** write the solo `.claude/charon.local.md` — fleet state lives with the ferryman, so the solo resume-net file never collides with the live orchestration.
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
