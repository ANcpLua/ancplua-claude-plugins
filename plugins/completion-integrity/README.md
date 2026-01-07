# completion-integrity

Prevents Claude from taking shortcuts to finish tasks.

## Problem

Claude sometimes:
- Suppresses warnings instead of fixing them
- Comments out failing tests
- Deletes assertions that fail
- Claims "done!" without running tests

## Solution

This plugin hooks into:
1. **Pre-commit** - Blocks commits with integrity violations
2. **Response end** - Warns when completion claims seem premature

## Install

```bash
/plugin install completion-integrity@ancplua-claude-plugins
```

## What Gets Blocked

- `#pragma warning disable` / `eslint-disable` / `# noqa`
- `// [Test]` (commented-out test attributes)
- Deleted `Assert.*` / `expect()` calls
- Deleted test files

## Manual Check

```bash
bash scripts/integrity-check.sh
```
