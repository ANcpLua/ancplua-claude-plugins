# Charon

> Ferries a GitHub PR all the way to merge — without ever waiting forever.

Charon is the ferryman. You point it at a pull request and it carries that PR across the
river to the far shore (merge), doing the reversible work itself and stopping only for the
one thing a human must do. It is built for the failure modes that make PR-babysitting
frustrating today:

| The problem you hit | What Charon does |
|---|---|
| "I'll wake in 5 min" — and never does; the tool waits forever | A **clock-independent** resume net. Control flow branches only on PR status, never on time. A missed wakeup degrades to a one-command resume, never a silent forever-wait. |
| `gh pr checks --watch` blocks the session indefinitely | **Never watches.** One snapshot per iteration, then rests and resumes. |
| "Just wait" with no real reason | An **honest status vocabulary**. Either it's doing something, or it names the one precise action only you can do. |
| AI reviewers (CodeRabbit / Codex / Codacy) suggest **outdated versions** | A **version-currency gate**: every version a reviewer names is verified against real source before any file changes. |
| Confused by multiple options / half-finished PRs / stale labels | **Grounding doctrine**: every decision rebuilt from a fresh live snapshot; cached labels and old summaries are never authority. |
| Merge conflicts / "must be force-merged" / broken linear history | Reversible repair done autonomously; irreversible ops use **propose-and-pause** with a **stamped recovery ref** so nothing is ever truly lost. |
| Blocked on a human reviewer | **Rewires** what you have authority over (post an agent review, retarget, fix the cause); honestly surfaces what only a human can approve. |

## How it works

```
Each iteration (never blocks):
  GROUND   → one live snapshot (gh pr view --json … / gh pr checks · NEVER --watch)
  CLASSIFY → a small state enum
  DISPATCH → exactly one handler (the extension seam — add a state + handler, additive)
  STATUS   → write an honest status; tell the user plainly
  END TURN → the Stop hook decides what's next
```

### The resume net (three layers, none clock-dependent for correctness)

1. **`ScheduleWakeup`** — paces the CI wait (~270s, stays in the prompt-cache window). *May miss — that's fine.*
2. **Stop hook** (`hooks/stop-hook.sh`) — deterministic re-entry on every stop **while work is actionable**; it lets the session *rest* while CI runs and *finishes* on merged/closed/needs-you. Modeled on the battle-tested `ralph-loop` hook. This is the safety net.
3. **External heartbeat** — re-running `/charon <pr>` (or an armed `/schedule` backstop) resumes deterministically across a dead session.

Because the Stop hook branches only on the state file's `status:` field — never on a timestamp — a system-clock change, laptop sleep, or timezone swap cannot corrupt it.

### Honest status vocabulary

🟢 `working` · 🟡 `ci-running` (not stuck — resting, will resume) · 🔵 `needs-you` (the one thing only you can do) · 🟠 `conflict` / `review-changes` · ⚫ `merged` / `closed`. The 🟡 and 🔵 lines are what kill the false "just wait."

## Commands

| Command | What it does |
|---|---|
| `/charon [<pr> \| .]` | Ferry one PR to merge (default: the current branch's PR). |
| `/charon:fleet [<pr> …]` | Ferry many PRs at once as an agent team (ferryman lead + one lookout per PR over a SendMessage bus). |
| `/charon:cancel` | Stop the active ferry and clear its state. The PR itself is untouched. |

It also rides `/loop` cleanly: `/loop /charon <pr>`.

## Skills

- **`charon`** — the ferry brain: state machine, handlers, honest status, resume net, propose-and-pause.
- **`reviewer-triage`** — ingest reviewer threads as untrusted input, evaluate against real code, and **verify any version before applying**.

## Agents (fleet mode)

- **`ferryman`** — fleet lead: dispatch, the honest fleet board, and the fallback that re-spawns a stalled lookout.
- **`lookout`** — runs the single-PR ferry on one PR and reports transitions to the ferryman.

## Propose-and-pause (the one human checkpoint)

Charon does every **reversible** thing itself. For an **irreversible** git op (force-push,
force-merge, admin override, history rewrite) it first stamps a recovery ref
(`git tag charon/recovery/pr-<n>-<sha>`), then stops and shows you: what's blocking, why a
force op is the genuine fix, the exact command, and the recovery ref that undoes it. You
approve; it executes next iteration. Nothing is ever unrecoverable.

## Dependencies

The `reviewer-triage` skill orchestrates these when present (all optional — it falls back to
the equivalent inline behavior):

- `superpowers:receiving-code-review` — the don't-blind-apply protocol.
- `metacognitive-guard:epistemic-checkpoint` — version/fact verification.
- `nuget-opensrc:opensrc-research` — confirm a package version exists and ships the referenced API.

Requires the `gh` CLI authenticated for the target repo. **GitHub-only** in this version; a
forge-backend seam is left for a later Forgejo backend.

## Scope and honesty

This version targets GitHub, uses `gh` + GraphQL, and pauses for the human on irreversible git
operations (by design). The one known resume gap — a missed `ScheduleWakeup` — is converted from
a silent forever-wait into a documented one-command resume (`/charon <pr>`). That trade is the
whole point: Charon would rather tell you the truth than tell you to wait.
