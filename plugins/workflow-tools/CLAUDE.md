# workflow-tools

Multi-agent orchestration via slash commands. 6 active + 2 deprecated commands.
Command-based counterpart to exodia (commands vs skills).

## Commands

| Command | Agents | Purpose |
|---------|--------|---------|
| `/fix` | 4-8 | Unified fix pipeline (standard=4, maximum=8). Replaced turbo-fix + fix-pipeline |
| `/mega-swarm` | 4-8 | Parallel audit (full=8, quick=4, focused=8) |
| `/red-blue-review` | 3+N+1 | Adversarial: Red attacks, Blue defends, Red re-attacks. Scored. |
| `/tournament` | N+2 | Competitive coding with penalty scoring (correctness 40, elegance 25, perf 20) |
| `/deep-think` | 4 | Multi-perspective analysis (2 understanding + 2 synthesis) |
| `/batch-implement` | N+2 | Parallel similar items (1 extractor + N implementers + 1 reviewer) |

## Deprecated (will be removed v3.0.0)

| Command | Replacement |
|---------|-------------|
| `/turbo-fix` | `/fix parallelism=maximum` |
| `/fix-pipeline` | `/fix` |

## Notes

- Agent count is CONSTRAINED (max 8 per command). Exodia skills are unlimited.
- All commands are in `commands/*.md` with proper frontmatter.
- Command-only plugin. No skills, hooks, or agents.
