# CLAUDE.md

<changelog-mandate>
Update CHANGELOG.md under `## [Unreleased]` before committing. No exceptions.
When modifying a plugin, bump `plugins/<name>/.claude-plugin/plugin.json` version.
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
| **CI Agent** | `claude-code-action` in GitHub Actions. PR reviews, autonomous fix PRs. |
| **Hooks** | Event-driven guards (PreToolUse, TaskCompleted). |

## Tri-AI System

Three autonomous AIs review every PR independently: Claude, Copilot, CodeRabbit.

| Agent | Reviews | Fix PRs | Auto-Merge |
|-------|---------|---------|------------|
| Claude | Yes | Yes (gh CLI) | No |
| Copilot | Yes | Yes (Coding Agent) | No |
| CodeRabbit | Yes | No | No |

Coordination is via shared files (CLAUDE.md, AGENTS.md, CHANGELOG.md), not real-time communication.
Do NOT speculate about what other AIs "might find" or add triangulation notes.

Auto-merge tiers: Dependabot patch/minor -> Copilot fix+CI -> Claude fix+CI+1 approval -> human review.

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

Skill priority: Superpowers skills > repo skills > plugin skills. If repo skill conflicts with Superpowers, prefer the more specific one and create an ADR.

## Plugin Constraints

- When adding/renaming/removing a plugin: update `.claude-plugin/marketplace.json`, run `claude plugin validate .`, update `docs/PLUGINS.md`, add CHANGELOG entry.
- SKILL.md files require YAML frontmatter with `name` (kebab-case, max 64 chars) and `description` (max 1024 chars).
- During development use `/reload-plugins` to activate changes without version bump.

## Workflow Triggers

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `claude.yml` | `@claude` mention | Interactive responses |
| `claude-code-review.yml` | PR opened/sync | Code review + fix PRs |
| Copilot Coding Agent | Issue assignment | Autonomous issue resolution |
