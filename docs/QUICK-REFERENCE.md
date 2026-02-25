# Quick Reference

> What to use when. Copy-paste the command.

## Decision Tree

```text
I need to...
├── Fix a bug
│   ├── P0 critical ──────────── /exodia:turbo-fix "description"
│   ├── P1-P3 standard ──────── /exodia:fix "description"
│   └── From audit findings ──── /exodia:fix-pipeline "description"
│
├── Build something
│   ├── New feature ──────────── /feature-dev
│   ├── Multiple similar items ── /exodia:batch-implement "items"
│   └── .NET warnings (nuke) ── /exodia:baryon-mode [scope|all]
│
├── Think / Decide
│   ├── Complex problem ──────── /exodia:deep-think "problem"
│   ├── Multiple approaches ──── /exodia:tournament "question"
│   └── Structured analysis ──── /metacognitive-guard:deep-analysis "topic"
│
├── Review code
│   ├── Quick review ─────────── /feature-dev:review [target]
│   ├── Competitive review ───── /metacognitive-guard:competitive-review
│   └── Security audit ──────── /exodia:red-blue-review "scope"
│
├── Audit / Scan
│   ├── Full codebase ────────── /exodia:mega-swarm scope=full
│   ├── Quick scan ───────────── /exodia:mega-swarm scope=quick
│   └── Focused area ─────────── /exodia:mega-swarm scope=focused "area"
│
├── Clean up
│   ├── Dead code / duplication ── /exodia:hades "scope" [focus] [intensity]
│   ├── Frontend design quality ── /exodia:hades "scope" --goggles
│   └── Maximum discipline ────── /exodia:eight-gates "objective" [scope]
│
├── Verify
│   ├── Fact-check versions ──── /metacognitive-guard:epistemic-checkpoint "claim"
│   ├── Confirm completion ───── /metacognitive-guard:verification-before-completion
│   └── .NET lint rules ──────── /dotnet-architecture-lint:lint-dotnet
│
├── OpenTelemetry
│   ├── Semconv question ──────── (auto: otel-expert skill activates)
│   ├── Sync upstream docs ───── /otelwiki:sync
│   └── Instrumentation help ── (auto: otel-guide agent spawns)
│
└── Hooks / Rules
    ├── Create a new rule ──────── /hookify:hookify "behavior to prevent"
    ├── List active rules ──────── /hookify:list
    ├── Toggle rules ──────────── /hookify:configure
    └── Get help ──────────────── /hookify:help
```

## Plugins at a Glance

| Plugin | One-liner |
|--------|-----------|
| **exodia** | Multi-agent orchestration — throw agents at problems |
| **metacognitive-guard** | Prevents wrong output, wrong reasoning, premature completion |
| **feature-dev** | Guided feature development + code review |
| **hookify** | User-configurable behavior rules |
| **otelwiki** | Bundled OpenTelemetry docs + sync |
| **dotnet-architecture-lint** | .NET MSBuild/CPM pattern enforcement |
| **ancplua-project-routing** | Routes to specialist agents per project |

## Exodia Commands

| Command | Agents | When |
|---------|--------|------|
| `/exodia:turbo-fix "desc"` | 13 | P0 critical bug, maximum parallelism |
| `/exodia:fix "desc"` | 8-16 | Any bug (P1-P3) |
| `/exodia:fix-pipeline "desc"` | 7 | Fixing findings from an audit |
| `/exodia:tournament "question"` | N+2 | Multiple valid approaches, need a winner |
| `/exodia:mega-swarm scope=X` | 6-12 | Codebase audit (full/quick/focused) |
| `/exodia:deep-think "problem"` | 5 | Analysis only, no implementation |
| `/exodia:batch-implement "items"` | N+2 | Parallel similar items (endpoints, tests, migrations) |
| `/exodia:red-blue-review "scope"` | 3+N | Adversarial security/quality review |
| `/exodia:baryon-mode [scope]` | 1+8 | .NET warning extermination (one-shot, cross-repo) |

## Exodia Skills

> **Note:** `eight-gates` and `hades` are **skills**, not slash commands.
> Invoke via the `Skill` tool — this loads their full SKILL.md workflow.

| Skill | Agents | When |
|-------|--------|------|
| `exodia:eight-gates "obj" [scope]` | 1-30+ | Maximum discipline — 8 gates, composes mega-swarm + fix + hades |
| `exodia:hades "scope" [focus] [--goggles]` | 12 (base) or 15 (--goggles) | Cleanup: dead code, duplication, suppressions. Teams required |

## Metacognitive-Guard

| Command | What it does |
|---------|-------------|
| `/metacognitive-guard:competitive-review` | Spawns arch-reviewer + impl-reviewer racing each other |
| `/metacognitive-guard:deep-analysis "topic"` | 4-phase: decompose → adversarial review → implement → verify |
| `/metacognitive-guard:epistemic-checkpoint "claim"` | Fact-checks versions/dates/status via assertions.yaml + WebSearch |
| `/metacognitive-guard:verification-before-completion` | Forces build+test before "done" claims |
| `/metacognitive-guard:metacognitive-guard` | Self-assessment: am I struggling? Should I escalate? |

**Auto-hooks (no command needed):**

- Truth Beacon — injects ground truth at session start
- Epistemic Guard — blocks writes with wrong versions/banned APIs
- Commit Integrity — blocks commits with suppressions or commented tests
- Struggle Detector — suggests deep-think when responses show uncertainty
- Task Completion Gate — validates team task completions aren't premature

## Feature-Dev

| Command | What it does |
|---------|-------------|
| `/feature-dev` | 7-phase guided development: discover → explore → clarify → architect → implement → review → summary |
| `/feature-dev:review [target]` | Standalone review: uncommitted changes, file, dir, staged, branch, or security audit |

## Agents (spawned automatically)

| Agent | Plugin | Purpose |
|-------|--------|---------|
| `code-architect` | feature-dev | Designs implementation blueprints from codebase patterns |
| `code-explorer` | feature-dev | Traces execution paths, maps dependencies |
| `code-reviewer` | feature-dev | Confidence-based review (only reports >=80% issues) |
| `arch-reviewer` | metacognitive-guard | SOLID violations, dependency issues, coupling |
| `impl-reviewer` | metacognitive-guard | Banned APIs, version mismatches, WebSearch fact-checks |
| `deep-think-partner` | metacognitive-guard | Async reasoning amplifier for complex problems |
| `otel-guide` | otelwiki | Answers OTel questions from bundled docs |
| `otel-librarian` | otelwiki | Syncs upstream OTel docs |
| `conversation-analyzer` | hookify | Scans transcripts for frustration patterns |

## Composition Patterns

```text
mega-swarm (audit) → findings → fix-pipeline (fix each)
mega-swarm (audit) → findings → hades (cleanup)
eight-gates = mega-swarm (MAP) + fix-pipeline (EXECUTE) + hades (HAKAI)
deep-think (analyze) → fix (implement)
competitive-review → fix (address findings)
tournament (decide) → batch-implement (build winner N times)
```
