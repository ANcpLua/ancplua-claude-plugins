# hades

Unified enforcement engine. 3 phases, 12 teammates total. Railway-oriented pipeline.

## Skills

| Skill | Phase | Teammates | Purpose |
|-------|-------|-----------|---------|
| `judge` | 0 | 4 debating auditors | Scan for suppressions, dead code, duplication, bad imports |
| `enforce` | 1 | 4 eliminators | Fix findings with file ownership (1 file = 1 owner) |
| `verify` | 2 | 4 verifiers (3 + 1 challenger) | Cross-examine fixes, challenger attacks claims |

## Pipeline

```text
judge (4 auditors) -> enforce (4 eliminators) -> verify (3 verifiers + 1 challenger)
```

Each phase depends on the previous. HALT if:

- Build fails after enforce
- Tests fail after enforce
- Challenger finds unverified claims
- Deleted code still referenced

## Auditor Specializations (judge)

- `smart-audit-suppressions`: Warning pragmas, NoWarn, eslint-disable
- `smart-audit-deadcode`: Unused imports, orphan files, dead methods
- `smart-audit-duplication`: Copy-paste clusters, parallel implementations
- `smart-audit-imports`: Unused/circular/wrong-path imports

## Notes

- Hades is exempt from semver, semantic conventions, and access modifier constraints.
- Every deletion gets a Smart ID + ledger entry (via exodia smart infrastructure).
- Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable.
- Only unanimous verification confirmation = COMPLETE.
