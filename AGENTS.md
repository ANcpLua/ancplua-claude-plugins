# Agent Operating Guide — ancplua-claude-plugins

> Sources: Boris Cherny (@bcherny) + Thariq (@trq212), 2026-04-16; Claude Opus 4.7 System Card (Anthropic, 2026-04-16,
> 232 pp.).  
> All System Card citations are to the April 16 2026 edition; page numbers are stable.

---

## Model & standard configuration

| Setting                                    | Value               | Why                                                                              |
|--------------------------------------------|---------------------|----------------------------------------------------------------------------------|
| Model                                      | Claude Opus 4.7     | —                                                                                |
| `effortLevel` / `CLAUDE_CODE_EFFORT_LEVEL` | `max`               | System Card p.192: "standard configuration: **adaptive thinking at max effort**" |
| `defaultMode`                              | `bypassPermissions` | Standing-authority repos; see Permission model below                             |
| `autoCompactEnabled`                       | `false`             | Every `/compact` is intentional — never silent                                   |
| `alwaysThinkingEnabled`                    | `true`              | Security property, not just quality (see Prompt injection below)                 |
| `agentPushNotifEnabled` + `voiceEnabled`   | `true`              | Leave long tasks running; recaps tell you what shipped and what's next           |

**Adaptive thinking** means the model determines per-query reasoning depth dynamically.  
`max` sets the ceiling; the model may use much less on a trivial query.
> System Card p.53: "the level of effort is **dynamically determined for each query by the model**"

**When to drop effort**: only for latency-constrained evals with wall-clock timeouts (the card ran Terminal-Bench 2.0
with thinking disabled for this reason, p.193). Interactive Claude Code sessions are not latency-constrained. Drop to
`high` for genuinely trivial, well-bounded edits (rename, format, single-file fix).

---

## Multi-agent architecture

```
Lead (this session)
  ├── continue            — same task; every token in window still load-bearing
  ├── rewind (esc-esc)    — wrong path; keep file reads, drop failed attempt
  ├── /compact <hint>     — mid-task bloat; steer the summary toward next direction
  ├── /clear + brief      — new task; hand-written context only, zero rot
  └── spawn subagent ────→ Task tool: own fresh window, returns conclusion only
```

**Spawn a subagent when** the next chunk will produce intermediate noise (file reads, greps,
dead ends) that the Lead will never need again. Only the report returns; exploration noise
is garbage-collected when the subagent exits.

**Don't spawn when** the intermediate output must be woven into ongoing reasoning —
use `/compact` or continue instead.

Mental test: *Will I need this tool output again, or just the conclusion?*

### Subagent patterns for this repo

| Task                                                 | Agent type            |
|------------------------------------------------------|-----------------------|
| Exploring a plugin's codebase for structure/patterns | Explore               |
| Verifying output against a spec or test suite        | general-purpose       |
| Writing docs from a git diff                         | general-purpose       |
| Reviewing upstream dependency changes                | general-purpose       |
| Security review of pending changes                   | security-review skill |

Context rot threshold for the 1M window: **~300–400k tokens** — task-dependent, not a
hard rule. File reads are the heavy hitter. Compact proactively, before the cliff edge.

---

## Known failure modes (System Card §6.2.1, p.95)

These are documented pilot-use findings for Opus 4.7 in Claude Code and similar scaffolds.
They are not hypothetical — account for them before claiming a task complete.

| Failure mode                                                                            | Mitigation                                                                              |
|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| Claims to have succeeded at a task it did not fully complete                            | Run the thing; don't accept a diff as evidence of working behavior                      |
| Misreports that test failures it *caused* were preexisting                              | Baseline tests before touching code; compare results against that baseline              |
| Overconfident initial root-cause assessment                                             | Engineering principle #10: understand the "why" before moving on; don't trial-and-error |
| Unnecessary follow-up questions on an already-clear request                             | Scope explicitly; use a bounded `/go`-style skill to eliminate ambiguity                |
| Unexpected file deletion when starting a new technical effort (especially in temp dirs) | Avoid unstructured temp-dir workflows; stage deletions explicitly                       |

**Positive calibration** (System Card p.91, p.120):  
Opus 4.7 takes destructive actions at a "much lower rate than Opus or Sonnet 4.6." Internal pilot reports describe it
as "significantly more conservative." Undisclosed destructive actions: **3 cases** for Opus 4.7 vs. **24 for Opus 4.6**.
Better, not zero — verification catches the residual.

---

## Prompt injection posture

`alwaysThinkingEnabled: true` is a **security property** in agentic contexts that read
untrusted content (file reads, web fetches, MCP tool output from external services).

From System Card §5.2.2 (adaptive Shade attacker):

| Surface                         | Thinking      | 1-attempt ASR | 200-attempt ASR |
|---------------------------------|---------------|---------------|-----------------|
| Coding (p.85)                   | on (adaptive) | **2.34%**     | 60.0%           |
| Coding (p.85)                   | off           | 10.43%        | 92.5%           |
| Browser use + safeguards (p.88) | on (adaptive) | **0.00%**     | 0.00%           |
| Browser use + safeguards (p.88) | off           | 0.00%         | 0.00%           |

At k=100 on the ART benchmark (p.83): 4.8% with adaptive thinking vs. 6.0% without.

Disabling thinking (e.g. for speed) materially increases injection risk when processing
external content. Don't disable it in agentic sessions touching files or the web.

---

## Permission model

`bypassPermissions` applies to standing-authority repos only:

- `/Users/ancplua/framework/` — ANcpLua.Agents, ANcpLua.Analyzers, ANcpLua.NET.Sdk, ANcpLua.Roslyn.Utilities, renovate-config
- `/Users/ancplua/qyl/`
- `/Users/ancplua/marketplaces/ancplua-claude-plugins/`

Outside these trees: ask before push, tag, or destructive git operations.

**Explicit `deny` overrides survive bypass**: `Git stash pop`, `Git stash` — these still prompt regardless of mode.

**`/fewer-permission-prompts`** — after any tool-heavy session, run this skill to harvest
bash + MCP commands for the allowlist. The allow list is currently empty; each harvested
entry reduces friction without compromising the deny overrides.

---

## Verification contract

> "4.7 is 2-3× more capable than 4.6 — verification is what keeps that velocity from compounding into invisible
> regressions."  
> — Boris Cherny, 2026-04-16

| Task type           | Verify via                                                                        |
|---------------------|-----------------------------------------------------------------------------------|
| Plugin / CLI / .NET | Run the test suite; `dotnet run` and hit endpoints; check output against baseline |
| Frontend            | `mcp__claude-in-chrome__*`: navigate, screenshot, read console + network          |
| Desktop app         | `mcp__computer-use__*`: screenshot and interact within tier rules                 |

Pattern: `<task> /go` — a per-project skill that tests end-to-end, runs `/simplify`, opens a PR.  
Without a `/go` skill: explicitly state "cannot verify" rather than claiming the task works.

---

## Focus vs. verbose

| Mode                  | What's visible                     | Use for                                            |
|-----------------------|------------------------------------|----------------------------------------------------|
| **Verbose** (current) | Every tool call + thinking summary | Architecture, security-adjacent, anything drifting |
| `/focus`              | Final result only                  | Trusted task types: refactors, lint, doc rewrites  |

`verbose: true` + `showThinkingSummaries: true` catches drift early but costs cognitive load.  
A/B `/focus` on tasks where you trust the agent; stay verbose where you don't.
