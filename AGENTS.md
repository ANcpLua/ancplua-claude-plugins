# AGENTS.md

> **Audience:** Codex, Copilot, CodeRabbit, and humans. Auto-loaded by Claude Code (CLAUDE.md is a symlink to this file).
>
> **Prefer retrieval-led reasoning over pre-training-led reasoning.**
> Always read the relevant SKILL.md before implementing. Skills are deep docs.

## Repository

ancplua-claude-plugins | 7 plugins, 22 commands, 9 agents.
Claude Code plugin marketplace. No C# or .NET code here.

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

Three autonomous AIs review every PR independently: Claude, Copilot, CodeRabbit (plus Codex for tier 3c auto-merge).

| Agent | Reviews | Fix PRs | Auto-Merge |
|-------|---------|---------|------------|
| Claude | Yes | Yes (direct push) | Yes (tier 3b) |
| Copilot | Yes | Yes (Coding Agent) | No |
| CodeRabbit | Yes | No | Yes (tier 3a) |
| Codex | Yes | No | Yes (tier 3c) |

Coordination is via shared files (AGENTS.md, CHANGELOG.md), not real-time communication.
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
| Struggling > 2 min | metacognitive-guard skill → deep-think-partner agent |
| Claiming done/complete/fixed | verification-before-completion skill (build+tests, show output) |
| Version/date/status question | epistemic-checkpoint skill (assertions.yaml, then WebSearch) |
| Complex decision / dead-end | deep-analysis skill (4-phase) |
| Code review needed | competitive-review skill (arch-reviewer + impl-reviewer) |
| Building new feature | feature-dev plugin (architect → explorer → reviewer) |
| Telemetry/observability code | otelhook (passive GenAI semconv), qyl genai-architect agent |
| CI verification before merge | metacognitive-guard verify-local.sh + wait-for-ci.sh |
| Creating hookify rules | writing-rules skill |
| .NET MSBuild/CPM patterns | dotnet-architecture-lint skill |
| Cleanup / dead code / suppressions | `/exodia:hades` (3 phases × 4 teammates, audit ledger) |
| Frontend cleanup + design quality | `/exodia:hades --goggles` (auto-equipped for .tsx/.jsx/.css/.html/.svelte/.vue) |
| Maximum disciplined orchestration | `/exodia:eight-gates` (8 progressive gates, composes all others) |
| Codebase audit | `/exodia:mega-swarm` (6/8/12 agents by mode) |
| Multiple solution perspectives | `/exodia:tournament` (N competitors) |
| Parallel similar items | `/exodia:batch-implement` (1+N+1 agents) |
| Adversarial security review | `/exodia:red-blue-review` (Red attacks, Blue defends) |
| .NET warning extermination | `/exodia:baryon-mode` (1 Invoker + 8 aspects, one-shot T0) |

Skill priority: Superpowers > repo > plugin skills.
If repo skill conflicts with Superpowers, prefer the more specific one and create an ADR.

## Compressed Docs Index

```text
[Commands]|root: ./plugins
|Every user-invocable skill has a commands/<name>.md file for CLI autocomplete
|dotnet-architecture-lint/commands:{lint-dotnet.md}
|exodia/commands:{fix.md,turbo-fix.md,fix-pipeline.md,tournament.md,mega-swarm.md,deep-think.md,batch-implement.md,red-blue-review.md,baryon-mode.md}
|feature-dev/commands:{feature-dev.md,review.md}
|hookify/commands:{help.md,list.md,configure.md,hookify.md}
|metacognitive-guard/commands:{metacognitive-guard.md,competitive-review.md,deep-analysis.md,epistemic-checkpoint.md,verification-before-completion.md}

[Skills]|root: ./plugins (only for skills needing hooks/argument-hint)
|exodia/skills/eight-gates:{SKILL.md}
|exodia/skills/hades:{SKILL.md,templates/}
|feature-dev/skills/code-review:{SKILL.md,references/common-patterns.md}
|hookify/skills/writing-rules:{SKILL.md,references/patterns-and-examples.md}

[Agents]|root: ./plugins
|Spawn via Task tool with subagent_type matching agent name
|metacognitive-guard/agents:{arch-reviewer.md,impl-reviewer.md,deep-think-partner.md}
|feature-dev/agents:{code-architect.md,code-explorer.md,code-reviewer.md}
|hookify/agents:{conversation-analyzer.md}

[Note: All agents live inside their plugins. No standalone agents directory.]
```

## Coordination

3 AIs (Claude, Copilot, CodeRabbit) coordinate via shared files.

| File | Read to | Write when |
|------|---------|------------|
| CHANGELOG.md | Know what's done | Completing work |
| AGENTS.md | Project rules + routing index | Never (human-maintained) |
| CLAUDE.md | Symlink to AGENTS.md | Never (auto-inherits) |

FORBIDDEN: Guessing what another AI thinks. Triangulation notes. Claiming consensus.

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

## Validation

```bash
./tooling/scripts/weave-validate.sh   # MUST pass before claiming done
claude plugin validate .               # Marketplace validation
```

## Conventions

- Plugin: `plugins/<name>/{.claude-plugin/plugin.json, README.md, skills/, commands/, hooks/}`
- Files: kebab-case. Skills: always `SKILL.md`. Linting: shellcheck, markdownlint, actionlint.
- Changes: `CHANGELOG.md` under `[Unreleased]`. Specs: `docs/specs/`. ADRs: `docs/decisions/`.
