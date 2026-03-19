# CLAUDE.md

<changelog-mandate>
Update CHANGELOG.md under `## [Unreleased]` before committing. No exceptions.
When modifying a plugin, bump `plugins/<name>/.claude-plugin/plugin.json` version AND sync marketplace.json.
weave-validate.sh hard-fails on version mismatches between the two.
</changelog-mandate>

<ci>
Validate before claiming done: `./tooling/scripts/weave-validate.sh`
</ci>

## Multi-Agent Model

| Layer | Description |
|-------|-------------|
| **Lead** | This session. Routes tasks, coordinates, never implements when teammates exist. |
| **Subagents** | Spawned via `Task`. Get CLAUDE.md + skills but NOT conversation history. All context must be in the spawn prompt. |
| **Teams** | Spawned via `TeamCreate`. Shared task lists, direct messaging. |
| **CI Agent** | `claude-code-action` in GitHub Actions. Reviews PRs, pushes fix commits directly (review-fix loop), approves when clean. |
| **Hooks** | Event-driven guards (PreToolUse, TaskCompleted). |

## Tri-AI System

Three autonomous AIs review every PR independently: Claude, Copilot, CodeRabbit.

| Agent | Reviews | Fix PRs | Auto-Merge |
|-------|---------|---------|------------|
| Claude | Yes | Yes (direct push) | Yes (tier 3b) |
| Copilot | Yes | Yes (Coding Agent) | No |
| CodeRabbit | Yes | No | Yes (tier 3a) |
| Codex | Yes | No | Yes (tier 3c) |

Coordination is via shared files (CLAUDE.md, AGENTS.md, CHANGELOG.md), not real-time communication.
Do NOT speculate about what other AIs "might find" or add triangulation notes.
CODEOWNERS auto-requests `@anthropic-code-agent` on every PR.

Auto-merge tiers (see `auto-merge.yml`): Dependabot/Renovate patch+minor → AI agent branches (copilot/, claude/) → CodeRabbit/Claude/Codex approved.
Only required check: GitGuardian. All AI reviews are advisory.

## Task Routing

| Condition | Route |
|-----------|-------|
| P0 critical bug | `/exodia:turbo-fix` (13 agents) |
| Fixing audit findings | `/exodia:fix-pipeline` (7 agents) |
| P1/P2/P3 bug | `/exodia:fix` (8-16 agents) |
| Struggling > 2 min | metacognitive-guard skill -> deep-think-partner agent |
| Claiming done/complete/fixed | verification-before-completion skill (build+tests, show output) |
| Version/date/status question | epistemic-checkpoint skill (assertions.yaml, then WebSearch) |
| Complex decision / dead-end | deep-analysis skill (4-phase) |
| Code review needed | competitive-review skill (arch-reviewer + impl-reviewer) |
| Building new feature | feature-dev plugin (architect -> explorer -> reviewer) |
| Telemetry/observability code | otel-expert skill, otel-guide agent |
| CI verification before merge | metacognitive-guard verify-local.sh + wait-for-ci.sh |
| Creating hookify rules | writing-rules skill |
| .NET MSBuild/CPM patterns | dotnet-architecture-lint skill |
| Cleanup / dead code / suppressions | `/exodia:hades` (3 phases x 4 teammates, audit ledger) |
| Frontend cleanup + design quality | `/exodia:hades --goggles` (auto-equipped for .tsx/.jsx/.css/.html/.svelte/.vue) |
| Maximum disciplined orchestration | `/exodia:eight-gates` (8 progressive gates, composes all others) |
| Codebase audit | `/exodia:mega-swarm` (6/8/12 agents by mode) |
| Multiple solution perspectives | `/exodia:tournament` (N competitors) |
| Parallel similar items | `/exodia:batch-implement` (1+N+1 agents) |
| Adversarial security review | `/exodia:red-blue-review` (Red attacks, Blue defends) |
| .NET warning extermination | `/exodia:baryon-mode` (1 Invoker + 8 aspects, one-shot T0) |

Skill priority: Superpowers > repo > plugin skills.
If repo skill conflicts with Superpowers, prefer the more specific one and create an ADR.

## Plugin Constraints

- When adding/renaming/removing a plugin: update `.claude-plugin/marketplace.json`,
  run `claude plugin validate .`, update `docs/PLUGINS.md`, add CHANGELOG entry.
- SKILL.md files require YAML frontmatter with `name` (kebab-case, max 64 chars) and `description` (max 1024 chars).
- Skills and commands support `effort: low|medium|high` frontmatter (2.1.80+). Match to cognitive load: orchestration → high, analysis → medium, lookups → low.
- During development use `/reload-plugins` to activate changes without version bump.

## Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `claude.yml` | `@claude` mention | Interactive responses |
| `claude-code-review.yml` | PR opened/sync | Review-fix loop: review → fix → push → re-review → approve |
| `codex-code-review.yml` | PR opened/sync | Codex review with structured output schema |
| Copilot Coding Agent | Issue assignment | Autonomous issue resolution |
