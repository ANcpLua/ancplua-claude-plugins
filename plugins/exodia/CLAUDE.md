# exodia

Multi-agent workflow orchestration. 9 commands + 1 skill (hades), unlimited parallel agents.

## Commands (in commands/)

| Command | Agents | Use When |
|---------|--------|----------|
| `eight-gates` | 1-30+ | Maximum disciplined orchestration — 8 progressive gates with checkpointing, budget tracking, Hakai guarantee |
| `turbo-fix` | 13 | P0 critical bugs |
| `fix` | 8-16 | Any bug fix (configurable parallelism) |
| `fix-pipeline` | 7 | Fixing audit findings systematically |
| `tournament` | N+2 | Multiple valid approaches, need competition |
| `mega-swarm` | 6-12 | Codebase audit (full/quick/focused modes) |
| `deep-think` | 5 | Analysis before action, no implementation |
| `batch-implement` | N+2 | Multiple similar items in parallel |
| `red-blue-review` | 3+N+1 | Adversarial security/quality review |

## Skill (in skills/ — uses hooks/argument-hint)

| Skill | Agents | Use When |
|-------|--------|----------|
| `hades` | 12 (3x4) | Smart cleanup with audit trail (Smart IDs, ledger, permits) |

## Smart Infrastructure

Located: `scripts/smart/`

| Script | Purpose |
|--------|---------|
| `lib.sh` | Shared utilities (`json_escape`) — sourced by all smart scripts |
| `smart-id.sh` | Generates `SMART-YYYY-MM-DD-<epoch><random>` IDs |
| `ledger.sh` | Append-only JSONL audit log with flock locking |
| `permit.sh` | TTL-based deletion permits with scope matching |
| `checkpoint.sh` | Gate checkpoint management (init/save/load/verify/list) |
| `session-state.sh` | TTL session state + artifact cache + decision log |

Hookify guard templates in `scripts/smart/hookify-rules/`:

- `delete-guard` blocks raw `rm`, `git rm`, `git clean`, `git reset --hard`
- `stop-guard` (optional) requires cleanup report before session stop

## Notes

- All commands/skills use blockquote teammate pattern (`> subagent: ... | model: ...`).
- Descriptions encode IF/THEN routing (Vercel pattern).
- Eight Gates composes all others: mega-swarm (MAP) -> fix pipelines (EXECUTE) -> hades (HAKAI).
- Exodia creates, Hades judges. They compose: mega-swarm -> hades.
