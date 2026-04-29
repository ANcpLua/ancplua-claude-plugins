# Opus 4.7 — Working Mode & Session Management

Sources: Boris Cherny (@bcherny, creator of Claude Code) and Thariq (@trq212), 2026-04-16.
Calibrated against this machine's `~/.claude/settings.json`. Grounded against the Claude Opus 4.7 System Card (April 16, 2026).

---

## My baseline

| Setting                                    | Value                              | Implication                                               |
|--------------------------------------------|------------------------------------|-----------------------------------------------------------|
| `defaultMode`                              | `bypassPermissions`                | Auto mode is N/A — already past it                        |
| `effortLevel` / `CLAUDE_CODE_EFFORT_LEVEL` | `max`                              | Matches Anthropic's own eval standard (System Card p.192) |
| `autoCompactEnabled`                       | `false`                            | Every `/compact` is intentional                           |
| `permissions.allow`                        | `[]`                               | `/fewer-permission-prompts` is high-leverage              |
| `agentPushNotifEnabled`, `voiceEnabled`    | `true`                             | Long-running tasks notify; recaps tell me what's next     |
| `alwaysThinkingEnabled`                    | `true`                             | Every turn thinks; no need to ask for "show your work"    |

---

## Effort levels — pinned at max

Opus 4.7 uses **adaptive thinking**, not fixed budgets. Five levels: `low` · `medium` · `high` · `xhigh` · `max` — Speed ↔ Intelligence.

Anthropic's own evaluation standard (System Card, Table 8.1.A, p.192):
> "all Claude Opus 4.7 results use the following standard configuration: **adaptive thinking at max effort**"

My config: `effortLevel: max` and `env.CLAUDE_CODE_EFFORT_LEVEL: max`. Maximum intelligence per turn, slowest output.

Calibration:

- **Drop to `high`** for trivial edits where faster turns matter and the task is well-bounded (rename, format, single-file fix).
- **`max` for everything that requires whole-system thinking** — tracing cascading impacts across layers.
- **`/fast` on Opus 4.6** is the alternative for speed without dropping intelligence — separate model, not a downgrade. Useful when 4.7 max is too slow but I don't want a smaller model.
- **Token budget note:** Higher effort produces more thinking tokens. For batch/long-output tasks (the System Card ran USAMO at medium because higher effort exceeded the API token limit, p.194). Not relevant for interactive Claude Code sessions, but worth knowing if running batch evals.

---

## Auto mode vs bypassPermissions

I'm on `bypassPermissions` globally under standing-authority repos (`/Users/ancplua/framework/`, `/qyl/`, `/ancplua-claude-plugins/`). Auto mode is the safer step down for contexts where bypass isn't granted.

Where bypass is still overridden: the two `deny` entries in settings (`Git stash pop`, `Git stash`) still prompt regardless of mode.

`/fewer-permission-prompts` — scans session history and recommends bash + MCP commands to add to the allowlist. Run after a tool-heavy session to harvest a starter list. One invocation: `/fewer-permission-prompts`.

---

## Recaps — keep on

Short summaries of what the agent did and what's next:

```
* Cogitated for 6m 27s
* recap: Fixing the post-submit transcript shift bug. The styling-flash
  part is shipped as PR #29869. Next: I need a screen recording of the
  remaining horizontal rewrap on `cc -c` to target that separate cause.
```

Composes with `agentPushNotifEnabled` + `voiceEnabled`: leave a long task running, get notified when it stops, the recap tells me what shipped and what's next without re-reading the diff. Disable in `/config` if needed.

---

## Focus mode — try it

`/focus` toggles hiding intermediate work, shows only the final result.

I run with `verbose: true` and `showThinkingSummaries: true` — opposite of focus. Trade-off:

- **Verbose (current):** Every tool call, every thinking summary. Catches drift early. Costs cognitive load.
- **Focus mode:** Only the result. Faster to triage. Drift only surfaces in the diff.

Worth A/B for tasks where I trust the agent (refactors, lint cleanups, doc rewrites). Keep verbose for architecture changes and security-adjacent code.

---

## Verification

Boris's framing per task type:

- **Backend** — Claude runs the server/service end-to-end. For .NET work: `dotnet run`, hit endpoints, check responses.
- **Frontend** — `mcp__claude-in-chrome__*` tools (navigate, screenshot, network/console reads).
- **Desktop apps** — `mcp__computer-use__*` tools (screenshot, click, type — within tier rules).

Pattern: `<task> /go`, where `/go` is a skill that tests end-to-end, runs `/simplify`, opens a PR.

4.7 is 2-3× more capable than 4.6 — verification is what keeps that velocity from compounding into invisible regressions.

---

## Context rot & session hygiene

The 1M context window is a hard cutoff. Performance degrades well before that — around **300–400k tokens** attention spreads thin and older content starts distracting. Task-dependent, not a fast rule.

The window holds: system prompt + every message + every tool call + every tool output + every file read. File reads are the heavy hitters.

### Five moves at the end of a turn

| Move                            | Carries forward                                  | Use when                                                                                          |
|---------------------------------|--------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **Continue**                    | everything                                       | Same task, every token in window is still load-bearing                                            |
| **Rewind** (esc-esc, `/rewind`) | prefix kept; tail dropped                        | Wrong path was taken; keep useful file reads, drop the failed attempt                             |
| **/compact `<hint>`**           | lossy model-written summary                      | Mid-task, session bloated with stale exploration; momentum matters more than precision            |
| **/clear + brief**              | only what I write                                | Starting a genuinely new task, or one fact extracted from 100k of exploration is now load-bearing |
| **Subagent** (`Task` tool)      | child does the work, returns only the conclusion | Next chunk will produce a lot of noise I won't need again                                         |

### Rewind beats correcting

Default instinct after a failed attempt: type "no, try B." That leaves the failed attempt + correction + fix in context.

> Correcting: `reads + failed attempt + correction + fix`
> Rewinding: `reads + one informed prompt + fix`

Before rewinding, prompt **"summarize from here"** — extract the lessons into a handoff message. That summary seeds the new prompt.

### /compact vs /clear + brief

**/compact** — model summarizes, replaces history with that summary. Lossy. Steerable: `/compact focus on the auth refactor, drop the test debugging`.

- Mid-task, keep momentum
- Risk: the model is at peak context-rot when compacting — its dumbest moment. Compact proactively, before the cliff edge.

**`/clear` + brief** — I write what matters, start clean.

- High-stakes next step
- Zero rot, full control

With `autoCompactEnabled: false`, I have room to `/compact` proactively. Don't wait for the auto-trigger threshold.

### Bad compacts

Happen when the model can't predict where work is going next. Long debugging session → autocompact → summary captures debugging arc → next message is "now fix that other warning in `bar.ts`" → dropped from summary.

Mitigations:
- Pass a hint naming the *next* direction, not just the past: `/compact keep the bar.ts warning we noticed, drop the foo.ts traces`
- For high-stakes pivots, prefer `/clear` + brief

### Subagents = garbage collection

Subagents get a fresh context window. They burn through file reads, greps, dead ends — return only the conclusion. Exploration noise lives and dies in their context, never enters mine.

**Mental test:** *Will I need this tool output again, or just the conclusion?*

If "just the conclusion," delegate:
- "Subagent: verify this work against this spec"
- "Subagent: read codebase X and summarize how it implemented Y, then I'll do the same here"
- "Subagent: write the docs from my git diff"

---

## Engineering principles

**IF starting new feature** → You're paid to solve problems, not write code
Understand the business problem. Consider non-code solutions. Work backward from desired outcome.

**IF evaluating approaches** → No "best" solution, only trade-offs
Document decision context. Know what you're optimizing for.

**IF adding code** → Less code is better code
Justify every line. Remove unused code immediately. Solve actual problems, not future maybes.

**IF adding abstraction** → Complexity kills projects
KISS. Prefer boring, straightforward solutions. Abstraction should hide complexity, not create it.

**IF encountering bug** → Fix root causes, not symptoms
Resist quick patches. Understand why it happened. Fix the class of bugs, not one instance.

**IF something unexpected** → Understand the "why" before moving on
Don't trial-and-error until it works. What assumption was wrong?

**IF making decisions** → Document the "why"
ADRs, RFCs, design docs. Explain context and alternatives.

**IF error occurs** → Errors should fail loudly and immediately
Silent failures = debugging nightmares. Provide clear context about what failed.

**IF debugging/optimizing** → Change one thing at a time
Can't know what worked if you change multiple things. Measure → change → measure again.

**IF designing API** → Easy to use correctly, hard to misuse
Use types to enforce constraints. Make invalid states unrepresentable. Good defaults + clear errors.

---

## Quick reference

| Topic            | My status                           | Action                                                              |
|------------------|-------------------------------------|---------------------------------------------------------------------|
| Auto mode        | N/A (bypass)                        | Shift+Tab to cycle modes if needed                                  |
| Allow list       | Empty                               | Run `/fewer-permission-prompts` after tool-heavy sessions           |
| Recaps           | On, composes with notifs/voice      | Keep                                                                |
| Focus mode       | Off (verbose)                       | A/B for trusted task types                                          |
| Effort           | Pinned `max`                        | Drop to `high` for trivial; `/fast` on 4.6 for speed-without-cost  |
| Verification     | Mandated in global CLAUDE.md        | Build a personal `/go` skill                                        |
| Context rot      | ~300–400k degradation threshold     | Compact proactively; rewind beats correcting; subagents = GC        |
| Session start    | New task = new session (default)    | Continue only when all context is still load-bearing                |
