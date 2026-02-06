# completion-integrity

Prevents Claude from taking shortcuts to finish tasks.

## Problem

Claude sometimes:

- Suppresses warnings instead of fixing them
- Comments out failing tests
- Deletes assertions that fail
- Claims "done!" without running tests

## Solution

Git pre-commit hook that blocks commits with integrity violations.

## Install

```bash
# Install the plugin
/plugin install completion-integrity@ancplua-claude-plugins

# Install the git hook in your repo
bash scripts/install-git-hook.sh
```

## What Gets Blocked

| Pattern | Type |
|---------|------|
| `#pragma warning disable` / `eslint-disable` / `# noqa` | VIOLATION |
| `// [Test]` (commented-out test attributes) | VIOLATION |
| Deleted `Assert.*` / `expect()` calls (>2) | VIOLATION |
| Deleted test files | VIOLATION |
| Empty `catch` blocks (swallowed exceptions) | WARNING |
| `.skip()` / `[Skip]` test markers | WARNING |
| Fresh TODOs (>2 per commit) | WARNING |

## Thresholds

- **Assertions deleted**: >2 triggers violation (allows minor refactoring)
- **TODOs added**: >2 triggers warning (allows occasional notes)

## Manual Check

```bash
bash scripts/integrity-check.sh
```

## Excluded Files

To avoid false positives, these are excluded from scanning:

- `*.md` (documentation may contain examples)
- `**/scripts/*.sh` (utility scripts)
- `**/*.test.*` / `**/*.spec.*` (test fixtures)
