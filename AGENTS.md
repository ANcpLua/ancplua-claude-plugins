# Agent Operating Guide — ancplua-claude-plugins

> This file is read by Claude Code, Codex / OpenAI Codex CLI, Codeium / Continue, and ChatGPT desktop on session init. Each tool reads only its own file (`AGENTS.md` for Codex-family, `CLAUDE.md` for Claude). Keep both self-contained — see `claudemd-curator` plugin for tooling that maintains the pair.

---

## Next session — start here

The two plugins added on 2026-05-09 (`claudemd-curator`, `session-debrief`) are **Phase 1 forks** of `anthropics/claude-plugins-official`. Phase 2 — substantive refactor — is the next session's job.

### Follow-up task: Phase 2 refactor of both plugins

**`claudemd-curator/` — workspace-aware curation**

| Phase 2 deliverable | Why it matters | Where it lands |
|---|---|---|
| Multi-repo workspace scan (not just `pwd`) | Standing-authority repos live under `~/framework/`, `~/qyl/`, `~/marketplaces/` — current upstream skill scans only the current repo | `skills/claudemd-curator/SKILL.md` Phase 1 Discovery → add `--workspace` mode |
| Plugin-aware audit cross-referenced with `marketplace-tour` capability snapshot | Existing `marketplace-tour` already produces `METADATA_DRIFT` / `CONTENT_DRIFT` / `STALE_<N>d` signals against `CLAUDE.md`; curator should consume them, not duplicate them | New section in `SKILL.md`: "Phase 2.5: Plugin mode" |
| `~/.claude/CLAUDE.md` (global) vs project `CLAUDE.md` overlap detection | Auto-memory and global rules drift from project memory over time; surface duplicates and mismatches | New `references/global-vs-project-overlap.md` |
| `cc-plugin-eval` integration: emit a curator-rubric score as one of its evaluator dimensions | Whole-plugin scoring already aggregates manifest + hooks + skills; CLAUDE.md/AGENTS.md quality is a missing dimension | New evaluator file in `plugins/cc-plugin-eval/src/evaluators/` |

**`session-debrief/` — analyzer + template upgrade**

| Phase 2 deliverable | Why it matters | Where it lands |
|---|---|---|
| Cache-rot >300k token cliff flag | The Opus 4.7 working-mode CLAUDE.md cites the 300–400k degradation threshold; the debrief should make individual sessions that crossed it visible | `analyze-sessions.mjs` `cacheBreaks` schema + new `degradation_cliff` field on session spans + new anomaly category in `template.html` |
| Effort-level attribution by reading `~/.claude/settings.json` `effortLevel` and env `CLAUDE_CODE_EFFORT_LEVEL` at session-start time | Correlates token spend with intelligence tier — currently invisible | New CLI flag `--settings-snapshot`, new column in by-session table |
| Marketplace-aware project tier mapping (`marketplace`/`framework`/`qyl`/`other`) | Raw `project` directory paths are noisy; tier rollup makes "where the context budget went" legible | `analyze-sessions.mjs` `classifyFile()` extension |
| Default output dir `~/.claude/reports/` (CWD-pollution fix), explicit `--output ./` flag for the current behaviour | Current default writes into whatever directory the user invoked from — leaks debrief HTML into commits | `skills/session-debrief/SKILL.md` Step 3 |
| Smoke-test harness: run the analyzer against the user's actual `~/.claude/projects/` and assert non-empty JSON, no thrown errors | Boris-style verification — keeps the analyzer honest when transcript JSONL schema drifts | New `tests/smoke.test.mjs`, version bump to 0.2.0 |
| Anomaly category for subagent types averaging >1M tokens/call | Already implied by the existing template comment block; not yet surfaced as a discrete rule | `template.html` AGENT block update |

When Phase 2 ships: bump both plugins to `0.2.0`, regenerate `claudemd-curator-example.png` and `revise-claudemd-example.png` against the new behaviour, update CHANGELOG.

### Open adopt / discuss / skip from the 2026-05-05 stack research

Source of truth: [`docs/research-2026-05-05-claude-code-stack.md`](docs/research-2026-05-05-claude-code-stack.md).

The next session must not silently re-research these — they have been verified once. Treat each row as a binary: **adopt this session**, **discuss with Alexander**, or **leave on the shelf**.

| Item | Default action | Open question |
|---|---|---|
| `open-telemetry/weaver registry mcp` | **Adopt** — highest-leverage single move for the v1.40 → v1.41 OTel work | Pin Weaver release to the same tag as the semconv release (currently v1.41.0) — confirm no Weaver upstream blocker before adding. |
| `oraios/serena` (LSP-backed semantic toolkit) | **Adopt via `uvx`, NOT marketplace** | Per Serena README, marketplace install conflicts with the harness. Confirm the `uvx --from git+https://github.com/oraios/serena serena-mcp-server` install line is still current at adopt time. |
| `MarcelRoozekrans/roslyn-codelens-mcp` | **Discuss** | Different layer than `rider-respect` (semantic-graph queries vs. action channel). Worth installing alongside, OR skip until the OTel migration analyzer work begins? |
| `Aaronontheweb/dotnet-skills` (cherry-pick: OTel-NET-Instrumentation, coding-standards, type-design-performance only) | **Adopt cherry-pick** | Skip Akka / Aspire / EF skills unless there's a specific need. |
| `NuGet.Mcp.Server` + `DimonSmart/NugetMcpServer` (paired: CVE state + API shape inspection) | **Discuss** | Requires .NET 10 SDK for the official one — confirm SDK is installed before adoption. |
| Semgrep MCP (`semgrep mcp` CLI subcommand) | **Adopt** | One line: `claude mcp add semgrep -- semgrep mcp`. No standalone repo install. |
| Socket MCP (supply-chain `depscore`) | **Adopt** | Use before adding any new NuGet/npm/PyPI dep. |
| `anthropics/claude-plugins-official` `code-modernization` + `code-review` | **Discuss** | `code-modernization` orthogonal to `dotnet-architecture-lint`; `code-review` overlaps lightly with `feature-dev`. Worth having both running, or do they cause duplicated review noise? |
| `github/github-mcp-server` (read-only, toolset-restricted) | **Adopt** | `claude mcp add github -- github-mcp-server stdio --read-only --toolsets repos,issues,pull_requests`. |
| `ast-grep` MCP | **Discuss** | Useful for structural C# refactors that go beyond grep. Adopt only if Phase 2 generator work needs it. |
| Cognition DeepWiki (hosted, no install) | **Adopt** | Endpoint: `https://mcp.deepwiki.com/mcp`. Read-only over public-repo wikis. Avoid `regenrek/deepwiki-mcp` — broken since DeepWiki cut off scraping. |
| `grafana/mcp-grafana` | **Skip for now** | Only relevant once OTel instrumentation is shipping traces to a Grafana / Tempo stack. |
| `upstash/context7` | **Discuss** | Originally tagged "skip" over Jan-2026 free-tier cut + ContextCrush vuln; reconciled 2026-05-05 — vuln patched, 54.4k★, MIT, broader OSS doc coverage than Microsoft Learn. Use with awareness. |
| FP / purity DIY: PurelySharp + Apex.Analyzers.Immutable + ErrorProne.NET wired through `hookify` | **Discuss (weekend project)** | Clear marketplace gap; existing infra (`hookify`) makes wiring trivial. Worth a `csharp-purity` plugin? |
| F# space (`jovaneyck/fsi-mcp-server` only real touchpoint) | **Skip** | Not in scope unless F# work appears. |
| ⚠ `csharp-lsp` (Anthropic), `zircote/csharp-lsp`, `SharpLensMcp`, `JoshuaRamirez/RoslynMcpServer`, `liatrio-labs/otel-instrumentation-mcp`, `Snyk MCP`, `wshobson/commands`, `xiaolai/claude-plugin-marketplace`, `VoltAgent/awesome-claude-code-subagents`, `better-clawd` | **Skip** — see research doc "Skip / avoid" table for reasons. Don't re-research. |

### Standing rules for the next session

- The two new plugins are **Phase 1 only**. Do not claim Phase 2 deliverables are done without working code, a smoke-test pass, and a regenerated example PNG where applicable.
- Both plugins retain the upstream Anthropic `LICENSE` inside the plugin directory. Don't remove it. Attribution to Isabella He (claude-md-management) and Anthropic stays in the README.
- The marketplace count in `README.md` and the marketplace metadata description must be updated together when adding/removing plugins. Current authoritative count: **19 plugins, 31 commands, 20 skills, 26 agents** (verified 2026-05-09 by `find plugins/*/skills -name SKILL.md` etc.). If a Phase 2 task adds counts, recount with the same `find` invocations.
- All Phase 2 file paths in the tables above are **proposed**, not promised. The first action of the next session must be a fresh inventory: read the current SKILL.md files and confirm the proposed integration points still match the code before editing.

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
