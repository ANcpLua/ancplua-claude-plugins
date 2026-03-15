# Calini Plugin

Carlini-style agent teams for qyl development. 8 agents work in parallel on the qyl
codebase with file ownership boundaries and git-based coordination.

## Agent Composition (8 agents, not 16/2)

The sweet spot for qyl is 3 generalists + 5 specialists:

| Role | Count | Owns | Why dedicated |
|------|-------|------|---------------|
| general | 3 | anything unlocked | cover breadth, handle cross-cutting work |
| collector | 1 | src/qyl.collector/ | OTLP + DuckDB is the hardest backend code |
| dashboard | 1 | src/qyl.dashboard/ | React 19 + Base UI needs frontend expertise |
| generators | 1 | src/qyl.*.generators/ | Roslyn IIncrementalGenerator is specialized |
| test-engineer | 1 | tests/ + E2E | quality gate — nothing ships without tests |

Integration, quality, and docs are handled by generalists (not enough volume for dedicated agents at 8-agent scale).

## File Ownership Boundaries

Prevents merge conflicts. Each specialist owns directories:

```
collector:    src/qyl.collector/**
dashboard:    src/qyl.dashboard/**
generators:   src/qyl.instrumentation.generators/**
              src/qyl.collector.storage.generators/**
test-engineer: tests/**
general:      everything else (src/qyl.agents/, src/qyl.workflows/,
              src/qyl.mcp/, src/qyl.loom/, src/qyl.contracts/,
              core/, eng/, docs/, specs/)
```

Cross-boundary changes require the owner to pull and merge.

## Coordination

- **CHANGELOG.md** is the shared brain (qyl convention)
- **Task locking** via `current_tasks/*.lock` files in git
- **PROGRESS.md** for dead ends and priorities
- No orchestrator agent — each agent self-directs
