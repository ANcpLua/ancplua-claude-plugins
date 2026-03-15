# Calini

Carlini-style parallel agent teams for qyl development.

Based on [Nicholas Carlini's research](https://www.anthropic.com/research/agent-teams)
where 16 Opus 4.6 agents built a C compiler from scratch. This plugin adapts the
approach for 8 agents targeting the qyl AI observability platform.

## Usage

```
/calini "implement Loom autofix pipeline"
/calini --dry-run "add RISC-V semconv support"
/calini --agents 4 "quick bug fix in collector"
```

## Agent Composition

| Agent | Count | Domain | Model |
|-------|-------|--------|-------|
| general | 3 | anything unlocked | Opus |
| collector | 1 | OTLP, DuckDB, REST API | Opus |
| dashboard | 1 | React 19, Base UI | Opus |
| generators | 1 | Roslyn IIncrementalGenerator | Opus |
| test-engineer | 1 | xUnit v3, Playwright E2E | Opus |

Quality, docs, and integration are handled by generalists at 8-agent scale.

## Why 8, Not 16/2

Carlini had 16 agents on a 100k-line compiler with hundreds of independent test cases.
qyl is a different beast:

- **Fewer independent work streams** — 7 projects, not hundreds of test files
- **Tighter coupling** — collector/dashboard/MCP share contracts
- **Merge conflict risk** — more agents = more conflicts on CHANGELOG.md
- **Specialization matters more** — Roslyn generators need deep expertise, not breadth

The sweet spot: 3 generalists for breadth + 5 specialists for the domains that need it.
At 8 agents, you get parallelism without the coordination overhead eating your gains.

## Coordination

- **File ownership** — each specialist owns directories, preventing merge conflicts
- **Task locking** — `current_tasks/*.lock` files committed to git
- **CHANGELOG.md** — source of truth (qyl convention)
- **No orchestrator** — agents self-direct (Carlini's approach)
