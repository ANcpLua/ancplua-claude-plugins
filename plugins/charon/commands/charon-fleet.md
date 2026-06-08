---
description: "Ferry several GitHub PRs at once as an agent team — a ferryman lead dispatches one lookout per PR; lookouts report state changes over a SendMessage bus; the lead is the fallback that re-spawns a stalled lookout. Use for multi-PR babysitting."
argument-hint: "[<pr> <pr> ...]   (omit = every open PR authored by you)"
allowed-tools: Bash, Read, Task, SendMessage, TeamCreate, TeamDelete, TodoWrite
---

# /charon:fleet — ferry many PRs as a team

Babysit multiple PRs concurrently. This is the "bigger-brother view" layer: a single
**ferryman** lead with the whole-fleet picture, one **lookout** per PR doing the
single-PR ferry, and a message bus between them. The lead is the third fallback — if a
lookout stalls or dies, the ferryman re-spawns it or takes over its PR directly.

Targets from `$ARGUMENTS` (space-separated PR numbers/URLs). If empty, enumerate:
```bash
gh pr list --author "@me" --state open --json number,title,headRefName,url
```

## Orchestration (council Teams-API pattern)

1. **Resolve the target set.** Confirm each PR exists and is open. If a PR is already
   merged/closed, drop it and say so. If the set is empty, stop — nothing to ferry.

2. **TeamCreate** — `team_name="charon-fleet"`, description = "Charon fleet: ferrying
   PRs #a, #b, #c".

3. **Spawn the ferryman lead:**
   - `Task: team_name="charon-fleet", name="ferryman", subagent_type="charon:ferryman"`
   - Hand it the full target set. It owns dispatch, the fleet-wide honest status board,
     and the fallback duty.

4. **Spawn one lookout per PR** (the ferryman keeps the roster):
   - `Task: team_name="charon-fleet", name="lookout-<pr>", subagent_type="charon:lookout"`
   - Each lookout runs the single-PR ferry (the `charon` skill procedure) against its
     one PR and posts every state transition to the team via **SendMessage** — the bus.

5. **React, do not poll.** The ferryman reads lookout messages as they arrive. When a
   lookout reports `needs-you`, the ferryman aggregates it into the board rather than
   blocking the whole fleet. When a lookout reports `merged`/`closed`, the ferryman
   retires it. If a lookout goes silent past its turn, the ferryman re-spawns it (or
   ferries that PR itself) — this is the fallback.

6. **Honest fleet board.** The ferryman maintains a single status board across all PRs
   using the same vocabulary as the solo ferry: `working` / `ci-running` / `needs-you` /
   `conflict` / `review-changes` / `merged` / `closed`. Never a vague "in progress".

7. **TeamDelete** once every PR is terminal (merged / closed / needs-you with the human
   action surfaced). Report the final board.

## Constraints

- Every lookout obeys the solo ferry rules: one snapshot, never `--watch`, root-cause CI
  fixes, version-verified reviewer suggestions, and **propose-and-pause** before any
  force-push / force-merge / history rewrite (with a stamped recovery ref first).
- Force operations are never executed inside fleet mode without surfacing them through
  the ferryman to the human — parallelism must not bury an irreversible action.
