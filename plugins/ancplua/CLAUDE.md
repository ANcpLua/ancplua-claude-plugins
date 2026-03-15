# ancplua — Agent Operating System

Philosophy and principles for all skills in this plugin.

## The Validation Constraint

**Code is opaque weights. Correctness is inferred exclusively from externally observable behavior.**

- Never review code quality as a proxy for correctness
- Never trust build output or test results as the final oracle
- The oracle is Playwright MCP: navigate, screenshot, evaluate
- A DOD item passes when the screenshot proves it works

## The Seed

Any input that starts a swarm:

- Natural language prompt ("build the dashboard with 3 charts")
- A screenshot of what needs to exist
- A codebase that needs modification

The seed becomes a Definition of Done (DOD) — a list of observable outcomes.

## The Diamond (Validation + Feedback)

```text
        ┌─── Seed ───┐
        │             │
   ┌────▼────┐  ┌─────▼────┐
   │ Worker  │  │  Worker   │  ... N workers in parallel
   └────┬────┘  └─────┬────┘
        │             │
        ▼             ▼
   Screenshot    Screenshot      ← Playwright oracle
        │             │
        ▼             ▼
   Pass/Fail     Pass/Fail
        │             │
        └──────┬──────┘
               ▼
         DOD satisfied?
```

Workers run in parallel. Each validates independently. No orchestrator aggregates — each worker
receives their items in the spawn prompt and works autonomously.

## The Fuel (Apply More Tokens)

When a worker is stuck:

1. Screenshot the error state
2. Analyze the screenshot visually
3. Convert the problem into a model-readable representation
4. Try a different approach

Errors are information. More tokens on the problem means more approaches explored.

## Technique Catalog

### Adopted

| Technique | Source | What It Does |
|-----------|--------|-------------|
| Prompt-embedded DOD | Carlini (adapted) | Pre-partition items across workers, embed in spawn prompt |
| Worktree isolation | Carlini (adapted) | Each worker gets an isolated git worktree |
| Autonomous execution | Carlini | Workers self-direct implementation and verification |
| Loop detection | Zechner | If same 3 tool calls repeat, force different approach |
| Context hygiene | Zechner | Errors to files, short stdout, avoid context bloat |
| Pyramid summaries | Zechner | Progressive summarization for long-running context |

### Deferred

| Technique | Why Deferred |
|-----------|-------------|
| DTU (Dynamic Task Unification) | Needs multi-worktree merge infrastructure |
| Semport (Semantic Porting) | Needs cross-language AST tooling |

## What This Plugin Is NOT

- Not exodia (no captain, no phases, no gates, no ceremony)
- Not agent-teams (no team lead, no task delegation, no file ownership rules)
- Not a build system (Playwright is the oracle, not dotnet build)
- Not Docker-based (worktrees, not containers)

## References

- [Carlini's C compiler](https://www.anthropic.com/engineering/building-c-compiler):
  16 parallel agents, no orchestrator, GCC oracle
- [Zechner's agent loop spec](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent):
  steering, loop detection, execution abstraction
