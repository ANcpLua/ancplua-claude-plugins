# autonomous-ci

CI verification enforcement. Blocks completion claims without proof of local tests AND remote CI passing.

## Files

| File | Purpose |
|------|---------|
| `skills/autonomous-ci/SKILL.md` | 5-step protocol: local verify, push, monitor CI, fix if fails, report |
| `skills/autonomous-ci/references/project-examples.md` | Quick-ref build/test commands by language |
| `scripts/verify-local.sh` | Auto-detects project type (dotnet/node/python/go) and runs tests |
| `scripts/wait-for-ci.sh` | Blocks until all GitHub Actions workflows pass for a commit |

## How It Works

1. `verify-local.sh` auto-detects the project and runs appropriate build+test
2. Code is committed and pushed
3. `wait-for-ci.sh` polls GitHub Actions via `gh` CLI until all workflows complete
4. Failure at any step = HALT, fix, retry

## Notes

- No hooks or commands. Skill-only plugin.
- Scripts are standalone bash, callable directly or via the skill workflow.
