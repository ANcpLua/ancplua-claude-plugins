# AGENTS.md

> **Audience:** Codex, Copilot, and humans. NOT auto-loaded by Claude Code.
> Claude's context is in CLAUDE.md (auto-loaded) and skill description frontmatter.
>
> **Prefer retrieval-led reasoning over pre-training-led reasoning.**
> Always read the relevant SKILL.md before implementing. Skills are deep docs.

## Repository

ancplua-claude-plugins | 7 plugins, 19 commands, 11 agents.
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
  → OR use feature-dev /review command for standalone review

IF building a new feature
  → use feature-dev plugin (code-architect → code-explorer → code-reviewer)

IF writing telemetry/observability code
  → read otel-expert skill, spawn otel-guide agent

IF CI verification before merge
  → use metacognitive-guard verify-local.sh + wait-for-ci.sh scripts

IF creating hookify rules
  → read writing-rules skill

IF .NET MSBuild/CPM patterns
  → read dotnet-architecture-lint skill

IF about to commit with suppressions/shortcuts
  → metacognitive-guard commit-integrity-hook blocks it automatically

IF multi-agent orchestration needed
  → exodia commands:
    /fix [issue]              - unified fix pipeline (configurable parallelism)
    /turbo-fix [issue]        - P0 maximum parallelism (16 agents)
    /fix-pipeline [issue]     - systematic resolution from audit findings
    /mega-swarm [scope]       - parallel codebase audit (6-12 agents)
    /red-blue-review [target] - adversarial security review
    /deep-think [problem]     - extended multi-perspective reasoning
    /tournament [task]        - competitive coding (N agents compete)
    /batch-implement [items]  - parallel similar implementations

IF zero-tolerance cleanup needed
  → exodia:hades skill (Smart cleanup with audit trail, 3 phases x 4 teammates)
```

## Compressed Docs Index

```text
[Commands]|root: ./plugins
|Every user-invocable skill has a commands/<name>.md file for CLI autocomplete
|dotnet-architecture-lint/commands:{lint-dotnet.md}
|exodia/commands:{fix.md,turbo-fix.md,fix-pipeline.md,tournament.md,mega-swarm.md,deep-think.md,batch-implement.md,red-blue-review.md}
|feature-dev/commands:{feature-dev.md,review.md}
|hookify/commands:{help.md,list.md,configure.md,hookify.md}
|metacognitive-guard/commands:{metacognitive-guard.md,competitive-review.md,epistemic-checkpoint.md,verification-before-completion.md}
|otelwiki/commands:{sync.md}

[Skills]|root: ./plugins (only for skills needing hooks/argument-hint)
|exodia/skills/hades:{SKILL.md,templates/}
|feature-dev/skills/code-review:{SKILL.md,references/common-patterns.md}
|hookify/skills/writing-rules:{SKILL.md,references/patterns-and-examples.md}
|otelwiki/skills/otel-expert:{SKILL.md}

[Agents]|root: ./plugins
|Spawn via Task tool with subagent_type matching agent name
|metacognitive-guard/agents:{arch-reviewer.md,impl-reviewer.md,deep-think-partner.md}
|otelwiki/agents:{otel-guide.md,otel-librarian.md}
|feature-dev/agents:{code-architect.md,code-explorer.md,code-reviewer.md}
|hookify/agents:{conversation-analyzer.md}

[Standalone Agents]|root: ./agents
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
