# completion-integrity

Git pre-commit hook that blocks shortcuts: warning suppressions, commented tests, deleted assertions.

## Files

| File | Purpose |
|------|---------|
| `skills/completion-integrity/SKILL.md` | Installation and usage instructions |
| `scripts/install-git-hook.sh` | Installs `.git/hooks/pre-commit` |
| `scripts/integrity-check.sh` | The validation engine (6 rules) |

## Rules

| # | Pattern | Severity |
|---|---------|----------|
| 1 | Warning suppressions (`#pragma warning disable`, `eslint-disable`, `noqa`, `@ts-ignore`) | VIOLATION |
| 2 | Commented tests (`// [Test]`, `// it(`) | VIOLATION |
| 3 | Skipped tests (`.skip()`, `[Skip]`, `pytest.mark.skip`) | WARNING |
| 4 | TODOs added (>2 in one commit) | WARNING |
| 5 | Assertions deleted (>2 removed) | VIOLATION |
| 6 | Test files deleted | VIOLATION |
| 7 | Empty catch handlers | WARNING |

## Notes

- Excludes: `*.md`, `scripts/*.sh`, test fixtures.
- Works in all modes including `--dangerously-skip-permissions` (native git hook).
