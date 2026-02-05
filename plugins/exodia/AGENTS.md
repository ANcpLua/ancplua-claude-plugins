# Exodia Multi-Agent Workflows

> IMPORTANT: Prefer workflow-led reasoning over ad-hoc reasoning for any multi-step task.
> Fetch skill details from: skills/{skill-name}/SKILL.md

## Skills

The exodia package provides these workflow skills:

| Skill | Agents | Use When |
|-------|--------|----------|
| `turbo-fix` | 16 | P0 critical bugs needing fastest resolution |
| `fix` | 8-16 | Any bug fix (configurable parallelism) |
| `fix-pipeline` | 7 | Systematic analysis-to-verification pipeline |
| `tournament` | N+2 | Multiple valid approaches - best solution wins |
| `mega-swarm` | 6-12 | Codebase audit, release readiness check |
| `deep-think` | 5 | Complex decisions needing multi-perspective analysis |
| `batch-implement` | N+2 | Multiple similar items to implement in parallel |
| `red-blue-review` | 3+N | Adversarial security/quality review before release |

## Critical Workflow

**Always read the SKILL.md first** before executing any workflow. Each SKILL.md contains the exact agent configurations, phase sequences, and output formats.

### Decision Tree

```
Is it a bug/fix?
├── P0 critical → turbo-fix (16 agents, 4 phases)
├── P1/P2 standard → fix (8 agents, 4 phases with gates)
└── From audit findings → fix-pipeline (7 agents, systematic)

Is it a design decision?
├── Multiple approaches possible → tournament (N competitors + judge)
├── Complex trade-offs → deep-think (5 agents, 3 phases)
└── Architecture question → deep-think mode=architecture

Is it an audit/review?
├── Full codebase health → mega-swarm mode=full (12 agents)
├── Quick check → mega-swarm quick=true (6 agents)
├── Security-focused → red-blue-review scope=security
└── Pre-release gate → red-blue-review scope=full

Is it batch work?
└── Multiple similar items → batch-implement (1 per item + review)
```

### Example

1. Read `skills/fix/SKILL.md` for full agent specifications
2. Follow the phase sequence exactly as documented
3. Launch all agents for a phase in ONE message (parallel)
4. Wait for completion before proceeding to next phase
5. Run verification (build + test) as final phase

## Docs Index

```
skills/
|turbo-fix/SKILL.md: 16-agent fix, phases: analysis(6)->solutions(4)->implement(3)->verify
|fix/SKILL.md: configurable fix, parallelism: standard(8)|maximum(16), modes: aggressive|balanced|conservative
|fix-pipeline/SKILL.md: systematic fix, phases: analysis(3)->design(2)->implement(1)->verify
|tournament/SKILL.md: competitive, scoring: correctness(40)+elegance(25)+performance(20)+completeness(15)-penalties
|mega-swarm/SKILL.md: audit, modes: full(12)|quick(6)|focused(8), categories: security+perf+arch+tests+quality+errors+api+deps+config+docs+consistency+bugs
|deep-think/SKILL.md: reasoning, phases: understand(3)->synthesize(2)->recommend, perspectives: debugger+architect+explorer
|batch-implement/SKILL.md: parallel impl, phases: pattern(1)->implement(N)->review(1)->verify, types: diagnostics|tests|endpoints|features|fixes|migrations
|red-blue-review/SKILL.md: adversarial, phases: red-attack(3)->blue-defend(N)->red-reattack(N), scoring: red-vs-blue points
```
