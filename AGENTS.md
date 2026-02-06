# AGENTS.md

> **Audience:** Codex, Gemini, and humans. NOT auto-loaded by Claude Code.
> Claude's context is in CLAUDE.md (auto-loaded) and skill description frontmatter.
>
> **Prefer retrieval-led reasoning over pre-training-led reasoning.**
> Always read the relevant SKILL.md before implementing. Skills are deep docs.

## Repository

ancplua-claude-plugins | Type A (Brain) | 11 plugins, 10 skills, 11 agents, 8 commands.
Consumes MCP tools from ancplua-mcp (Type T/Hands). No C# or .NET code here.

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
  → exodia skills (UNRESTRICTED - unlimited parallel agents):
    fix                - P1/P2/P3 bugs (8 std, 16 max agents)
    turbo-fix          - P0 critical emergency (16 agents, fastest)
    fix-pipeline       - audit-driven systematic fixes (6 agents)
    mega-swarm         - codebase audit (6/8/12 agents by mode)
    deep-think         - multi-perspective analysis (5 agents)
    tournament         - competitive solutions (N+2 agents)
    batch-implement    - parallel similar items (1+N+1 agents)
    red-blue-review    - adversarial security (3+N+1 agents)

  → workflow-tools commands (DEPRECATED - use exodia skills):
    /fix, /mega-swarm, /red-blue-review, /deep-think, /tournament, /batch-implement

IF zero-tolerance cleanup needed
  → cleanup-specialist agent (agents/cleanup-specialist/)
```

## Compressed Docs Index

```text
[Skills]|root: ./plugins
|IMPORTANT: Always read SKILL.md first for workflow instructions
|autonomous-ci/skills/autonomous-ci:{SKILL.md,references/project-examples.md}
|code-review/skills/code-review:{SKILL.md,references/common-patterns.md}
|completion-integrity/skills/completion-integrity:{SKILL.md}
|dotnet-architecture-lint/skills/dotnet-architecture-lint:{SKILL.md}
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

[Exodia Skills]|root: ./plugins/exodia/skills
|PREFERRED: Use skills, not commands. Unlimited parallelism.
|{fix,turbo-fix,fix-pipeline,mega-swarm,deep-think,tournament,batch-implement,red-blue-review}
|Decision Tree: See IF/THEN patterns in each SKILL.md description frontmatter
|Key: P0→turbo-fix, P1-P3→fix, audit→mega-swarm, systematic→fix-pipeline

[Commands]|root: ./plugins/workflow-tools/commands
|DEPRECATED: Use exodia skills instead
|{fix.md,mega-swarm.md,red-blue-review.md,deep-think.md,tournament.md,batch-implement.md}
|turbo-fix.md,fix-pipeline.md also deprecated

[Standalone Agents]|root: ./agents
|cleanup-specialist:{prompts/,config/}
|repo-reviewer-agent:{config/}
```

## Coordination

4 AIs (Claude, Copilot, Gemini, CodeRabbit) coordinate via shared files.

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
