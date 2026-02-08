# cleanup-specialist (DEPRECATED)

**Use `exodia/hades` skill instead.** This agent is maintained for backwards compatibility only.

## What It Did

5-phase zero-tolerance cleanup:

0. Suppression audit
1. Dead code elimination
2. Duplication elimination
3. Cross-repo cascade
4. Iterate until clean

## Migration

Replace with: `exodia/hades` skill which provides:

- Smart IDs for audit trail
- Deletion permits for safety
- JSONL ledger for accountability
- 12 teammates across 3 phases (judge/enforce/verify)
