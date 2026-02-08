# AGENTS.md

> **Audience:** Codex, Copilot, and humans. NOT auto-loaded by Claude Code.
> Claude's context is in CLAUDE.md (auto-loaded) and skill description frontmatter.
>
> **Prefer retrieval-led reasoning over pre-training-led reasoning.**
> Always read the relevant SKILL.md before implementing. Skills are deep docs.

## Repository

ancplua-claude-plugins | 11 plugins, 19 skills, 11 agents, 8 commands.
Claude Code plugin marketplace. No C# or .NET code here.

## Decision Tree

```text
IF struggling > 2 min
  → read metacognitive-guard skill, escalate to deep-think-partner agent

IF claiming done/complete/fixed/works
  → read verification-before-completion skill (run build+tests, show output)

IF version/date/status question
  → read epistemic-checkpoint skill (check assertions.yaml, then WebSearch)

IF code review needed
  → read competitive-review skill (spawns arch-reviewer + impl-reviewer)

IF building a new feature
  → use feature-dev plugin (code-architect → code-explorer → code-reviewer)

IF writing telemetry/observability code
  → read otel-expert skill, spawn otel-guide agent

IF CI verification before merge
  → read autonomous-ci skill

IF creating hookify rules
  → read writing-rules skill

IF .NET MSBuild/CPM patterns
  → read dotnet-architecture-lint skill

IF about to commit with suppressions/shortcuts
  → completion-integrity blocks it automatically

IF multi-agent orchestration needed
  → workflow-tools commands:
    /fix [issue]              - unified fix pipeline (configurable parallelism)
    /mega-swarm [scope]       - parallel codebase audit (6-12 agents)
    /red-blue-review [target] - adversarial security review
    /deep-think [problem]     - extended multi-perspective reasoning
    /tournament [task]        - competitive coding (N agents compete)
    /batch-implement [items]  - parallel similar implementations

IF zero-tolerance cleanup needed
  → exodia/hades skill (Smart cleanup with audit trail)

IF multi-agent orchestration as skills (unlimited agents)
  → exodia skills: fix, turbo-fix, fix-pipeline, tournament, mega-swarm,
    deep-think, batch-implement, red-blue-review, hades

IF enforcement/judgment needed
  → exodia/hades skill (Smart cleanup with audit trail, 3 phases x 4 teammates)
```

## Compressed Docs Index

```text
[Skills]|root: ./plugins
|IMPORTANT: Always read SKILL.md first for workflow instructions
|autonomous-ci/skills/autonomous-ci:{SKILL.md,references/project-examples.md}
|code-review/skills/code-review:{SKILL.md,references/common-patterns.md}
|completion-integrity/skills/completion-integrity:{SKILL.md}
|dotnet-architecture-lint/skills/dotnet-architecture-lint:{SKILL.md}
|exodia/skills:{turbo-fix,fix,fix-pipeline,tournament,mega-swarm,deep-think,batch-implement,red-blue-review,hades}/SKILL.md
|hookify/skills/writing-rules:{SKILL.md,references/patterns-and-examples.md}
|metacognitive-guard/skills/metacognitive-guard:{SKILL.md}
|metacognitive-guard/skills/competitive-review:{SKILL.md}
|metacognitive-guard/skills/epistemic-checkpoint:{SKILL.md}
|metacognitive-guard/skills/verification-before-completion:{SKILL.md}
|otelwiki/skills/otel-expert:{SKILL.md}

[Agents]|root: ./plugins
|Spawn via Task tool with subagent_type matching agent name
|metacognitive-guard/agents:{arch-reviewer.md,impl-reviewer.md,deep-think-partner.md}
|otelwiki/agents:{otel-guide.md,otel-librarian.md}
|feature-dev/agents:{code-architect.md,code-explorer.md,code-reviewer.md}
|hookify/agents:{conversation-analyzer.md}

[Commands]|root: ./plugins/workflow-tools/commands
|Invoke via /workflow-tools:<name>
|{fix.md,mega-swarm.md,red-blue-review.md,deep-think.md,tournament.md,batch-implement.md}
|DEPRECATED:{turbo-fix.md→/fix parallelism=maximum,fix-pipeline.md→/fix}

[Standalone Agents]|root: ./agents
|cleanup-specialist:{prompts/,config/}
|repo-reviewer-agent:{config/}
```

## Coordination

3 AIs (Claude, Copilot, CodeRabbit) coordinate via shared files.

| File | Read to | Write when |
|------|---------|------------|
| CHANGELOG.md | Know what's done | Completing work |
| CLAUDE.md | Project rules | Never (human-maintained) |
| AGENTS.md | This routing index | Never (human-maintained) |

FORBIDDEN: Guessing what another AI thinks. Triangulation notes. Claiming consensus.

## Validation

```bash
./tooling/scripts/weave-validate.sh   # MUST pass before claiming done
claude plugin validate .               # Marketplace validation
```

## Conventions

- Plugin: `plugins/<name>/{.claude-plugin/plugin.json, README.md, skills/, commands/, hooks/}`
- Files: kebab-case. Skills: always `SKILL.md`. Linting: shellcheck, markdownlint, actionlint.
- Changes: `CHANGELOG.md` under `[Unreleased]`. Specs: `docs/specs/`. ADRs: `docs/decisions/`.
