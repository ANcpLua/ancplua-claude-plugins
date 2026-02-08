# exodia v1.1.0

Multi-agent workflow orchestration as skills (skills.sh open standard).

Skills-standard counterpart to `workflow-tools`. Same workflows, discoverable as skills instead of slash commands.

## Skills

| Skill | Agents | Pattern | Best For |
|-------|--------|---------|----------|
| `turbo-fix` | 16 | Phased pipeline | P0 critical bugs |
| `fix` | 8-16 | Configurable pipeline | Any bug fix |
| `fix-pipeline` | 7 | Systematic pipeline | Audit findings |
| `tournament` | N+2 | Competition | Quality optimization |
| `mega-swarm` | 6-12 | All parallel | Codebase audit |
| `deep-think` | 5 | Multi-perspective | Analysis before action |
| `batch-implement` | N+2 | Template + parallel | Similar items |
| `red-blue-review` | 3+N | Adversarial | Security review |

## Typical Workflow

```text
1. Audit the codebase         → mega-swarm mode=quick
2. Fix critical issues        → turbo-fix (P0) or fix (P1/P2)
3. Security review            → red-blue-review scope=security
4. Architectural decisions    → deep-think mode=architecture
5. Batch implement features   → batch-implement type=endpoints
6. Re-audit                   → mega-swarm mode=full
```

## Relationship to workflow-tools

| workflow-tools | exodia |
|---------------|--------|
| `commands/*.md` (slash commands) | `skills/*/SKILL.md` (skills standard) |
| Invoked via `/workflow-tools:fix` | Discovered via skill matching |
| No passive context | Routing embedded in skill descriptions |

Both contain identical workflow specifications. Use `workflow-tools` for explicit
slash-command invocation, `exodia` for skill-based discovery.

## Installation

```bash
claude plugin marketplace add ANcpLua/ancplua-claude-plugins
claude plugin install exodia@ancplua-claude-plugins
```

## License

MIT
