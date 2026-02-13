# exodia v2.0.0

Multi-agent workflow orchestration. 10 commands + 1 skill (hades).

## Commands

| Command | Agents | Pattern | Best For |
|---------|--------|---------|----------|
| `/exodia:eight-gates` | 1-30+ | Progressive discipline | Maximum orchestration with checkpointing + Hakai |
| `/exodia:turbo-fix` | 13 | Phased pipeline | P0 critical bugs |
| `/exodia:fix` | 8-16 | Configurable pipeline | Any bug fix |
| `/exodia:fix-pipeline` | 7 | Systematic pipeline | Audit findings |
| `/exodia:tournament` | N+2 | Competition | Quality optimization |
| `/exodia:mega-swarm` | 6-12 | All parallel | Codebase audit |
| `/exodia:deep-think` | 5 | Multi-perspective | Analysis before action |
| `/exodia:batch-implement` | N+2 | Template + parallel | Similar items |
| `/exodia:red-blue-review` | 3+N | Adversarial | Security review |
| `/exodia:baryon-mode` | 1+8 | One-shot T0 burst | .NET warning extermination |

## Skill (uses hooks/argument-hint)

| Skill | Agents | Pattern | Best For |
|-------|--------|---------|----------|
| `exodia:hades` | 12 (3x4) | Smart cleanup | Audited elimination |

## Typical Workflow

```text
1. Go all-in on objective     → /exodia:eight-gates "ship v2.0" . 8
2. Audit the codebase         → /exodia:mega-swarm mode=quick
3. Exterminate warnings       → /exodia:baryon-mode path/to/Solution.sln
4. Fix critical issues        → /exodia:turbo-fix (P0) or /exodia:fix (P1/P2)
5. Security review            → /exodia:red-blue-review scope=security
6. Architectural decisions    → /exodia:deep-think mode=architecture
7. Batch implement features   → /exodia:batch-implement type=endpoints
8. Re-audit                   → /exodia:mega-swarm mode=full
```

## Installation

```bash
claude plugin marketplace add ANcpLua/ancplua-claude-plugins
claude plugin install exodia@ancplua-claude-plugins
```

## License

MIT
