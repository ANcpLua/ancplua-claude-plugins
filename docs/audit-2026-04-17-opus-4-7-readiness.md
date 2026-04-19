# Opus 4.7 / 1M Context Readiness Audit

Date: 2026-04-17
Scope: all 13 plugins in `plugins/` + `.claude-plugin/marketplace.json`.
Tier baseline: Claude Max x20, Opus 4.7 default, 1M context.

## Methodology

Systematic greps across four anti-pattern dimensions:

- **A — Hard errors on Opus 4.7**: `temperature`, `top_p`, `top_k`, old `thinking.enabled + budget_tokens` API.
- **B — Tier wastes**: generic `model: sonnet|haiku` defaults, `effort: low|medium` for analysis/coding work, `max_tokens <16k`.
- **C — Architecture smells**: `references/` splits that a single SKILL.md could carry, subagent inflation for tasks one Opus-4.7 instance can do alone, "be terse / under 200 words" boilerplate in prompts that rewards brevity over substance.

Each hit was opened and categorized in context — not every `effort: low` is wrong (pure lookups are legitimately low).

## Category A — Hard errors

**Count: 0**

Initial loose grep surfaced 4 files containing the literal strings `temperature` / `top_p` / `top_k`:

- `plugins/otelhook/data/genai-semconv.md` — OTel semantic-convention documentation (mentions as attribute names, not agent config).
- `plugins/design-studio/skills/design-studio/data/styles.csv` — design-system CSV data rows.
- `plugins/qyl/agents/genai-architect.md` — semantic-convention knowledge referenced in the agent prompt.
- `plugins/qyl/agents/captain.md` — same category.

Tightened grep (`temperature\s*[=:]|top_p\s*[=:]|top_k\s*[=:]`) returns **zero** hits that are actual sampling-parameter assignments. No Opus-4.7 hard errors. No `budget_tokens` / old `thinking.enabled` API anywhere. No migration to adaptive-thinking needed.

## Category B — Tier wastes (fixed)

### Agents — `model: sonnet` → `model: opus` / explicit latest pin

| Plugin | Agent | Before | After | Reason |
|---|---|---|---|---|
| feature-dev | code-reviewer | `sonnet` / `medium` | `opus` / `high` | Full-fledged reviewer, not research |
| feature-dev | code-explorer | `sonnet` / `medium` | `opus` / `high` | Deep analysis, tracing, mapping |
| feature-dev | code-architect | `sonnet` / `high` | `opus` / `high` | Architecture design |
| elegance-pipeline | elegance-scout | `sonnet` / `low` | `claude-sonnet-4-6` / `medium` | Research-only scoring role — pin to latest Sonnet, research-only per user policy |
| ancplua | worker | `sonnet` / `low` | `opus` / `xhigh` | Self-directing agentic implementer in worktree — canonical "coding/agentic" role |
| hookify | conversation-analyzer | `opus` / `medium` | `opus` / `high` | Model already correct; transcript analysis is high cognitive load |
| qyl | 8 agents (captain, collector, dashboard, general, generators, integration, quality, test-engineer) | `claude-opus-4-6` | `claude-opus-4-7` | Pinned to latest Opus per user "default Opus 4.7" policy |
| qyl | quality | (effort) `medium` | `high` | Reviews, refactors, edits other agents' output = coding |
| council | opus-captain | `claude-opus-4-6` | `claude-opus-4-7` | Latest Opus |

### Commands / skills — `effort:` bumps

| Plugin | File | Before | After | Reason |
|---|---|---|---|---|
| feature-dev | commands/review.md | `medium` | `high` | Review is analysis |
| metacognitive-guard | commands/deep-analysis.md | `medium` | `xhigh` | 4-phase structured reasoning = canonical max-reasoning |
| metacognitive-guard | commands/metacognitive-guard.md | `low` | `high` | Struggle-signal analysis, not lookup |
| metacognitive-guard | commands/epistemic-checkpoint.md | `low` | `medium` | Verification with WebSearch — some reasoning |
| metacognitive-guard | commands/verification-before-completion.md | `low` | `medium` | Pre-completion evidence check |
| design-studio | commands/design-studio.md | `medium` | `high` | Creative direction + BM25 synthesis |
| design-studio | skills/design-studio/SKILL.md | `medium` | `high` | Same — design system generation |
| qyl | commands/audit.md | `medium` | `xhigh` | 6-domain architectural audit |
| exodia | commands/deep-think.md | `medium` | `xhigh` | 5-agent 3-phase reasoning |
| exodia | skills/hades/SKILL.md | `high` | `xhigh` | 12-agent orchestrator, Noble-Phantasm-scale cleanup |
| hookify | commands/hookify.md | `low` | `high` | Rule design from conversation signals |
| hookify | commands/configure.md | `low` | `medium` | Interactive edits with AskUserQuestion |
| hookify | skills/writing-rules/SKILL.md | `low` | `medium` | Authoring reference, active use |

### Kept as-is — justified

| Plugin | File | Setting | Why |
|---|---|---|---|
| council | haiku-janitor | `claude-haiku-4-5-20251001` / `low` | Explicit cost-bounded bloat-flagger. Correct by design |
| council | sonnet-researcher / synthesizer / clarity | `claude-sonnet-4-6` / `medium` | Council is a deliberate cost-bounded parallel brain-trust — research/synthesis/clarity partitioned across latest Sonnet |
| qyl | genai-architect | `claude-sonnet-4-6` / `medium` | Research-only semantic-convention specialist |
| qyl | docs | `claude-sonnet-4-6` / `medium` | Documentation specialist, keeps CHANGELOG accurate. Non-coding |
| hookify | commands/help.md, list.md | `low` | Pure lookups, latency-sensitive |
| dotnet-architecture-lint | commands/lint-dotnet.md | `low` | Pure lint runner |
| hades skill | internal haiku prompt hooks (3x) | `haiku` | Cost-bounded enforcement prompts, correct by design |
| code-simplifier | agents/code-simplifier.md | `opus` / `high` | Already correct |

### `max_tokens` caps

Zero hits in grep `max_tokens[":= ]+[0-9]{3,4}\b`. No explicit low caps to raise.

### Terse-prompt boilerplate

Zero hits for `under 200 words`, `be terse`, `be brief`, `respond concisely` in `plugins/`. No brevity-for-brevity's-sake boilerplate to remove.

## Category C — Architecture smells (flagged, not fixed)

This audit intentionally refactored, not rewrote. The following smells are out of scope for this pass:

### `references/` dirs — consolidation candidates (3 remaining)

- `plugins/skill-creator/skills/skill-creator/references/` (recently added, 1.0.0 plugin, structured knowledge base — probably stays)
- `plugins/qyl/skills/qyl-audit/references/` (audit knowledge, tight scope per file — probably stays)
- `plugins/hookify/skills/writing-rules/references/` (one file: patterns-and-examples.md — merge candidate)

(`plugins/qyl-lsp/.../references/` is being removed in PR #212.)

### Redundancy / consolidation candidates (user-flagged principle: "viele ähnliche Dinge die das gleiche tun")

Surface-level overlap observed, not investigated deeply in this pass:

- Review surface: `feature-dev` (code-reviewer, /review), `elegance-pipeline` (whole workflow), `metacognitive-guard` (competitive-review) — three different mental models of "review."
- Analysis/thinking surface: `exodia:deep-think`, `metacognitive-guard:deep-analysis`, `council:council` — all three are "think harder" orchestrators with different shapes (5-agent phases, 4-phase structured, 5-agent brain-trust).
- Orchestration surface: `exodia` has 9 commands + 2 skills, many with overlapping intent (fix vs. turbo-fix vs. fix-pipeline).

None of these were consolidated in this audit — doing so would be rewrite, not refactor, and requires the user's explicit OK per the hard rules.

### Hooks truncating output

Not audited in this pass. The Opus 4.7 + 1M context tier argues against aggressive output truncation, but the hook scripts live in `hooks/scripts/*.sh` / `hooks/scripts/*.py` and deserve a dedicated pass.

## Summary

- Plugins touched: **8** (feature-dev, elegance-pipeline, ancplua, qyl, hookify, metacognitive-guard, design-studio, exodia, council) — one commit per plugin.
- Category A (hard errors on Opus 4.7): **0**.
- Category B (tier wastes) fixed: **13 agents** (9 model bumps, 4 effort bumps) + **13 commands/skills** (effort bumps).
- Category C (architecture smells) flagged: **3** `references/` dirs + **3** surface-overlap zones + **1** hook-output-truncation pass.
- Validation: `./tooling/scripts/weave-validate.sh` PASSED before push.
