---
name: completion-integrity
description: Prevents shortcuts and cheating when completing tasks. Blocks commits with warning suppressions, commented tests, or deleted assertions.
---

# Completion Integrity

This plugin enforces honest task completion by detecting and blocking shortcuts.

## What It Catches

| Pattern | Why It's Bad |
|---------|--------------|
| Warning suppression (`#pragma warning disable`, `eslint-disable`) | Hides problems instead of fixing them |
| Commented-out tests | Tests exist for a reason |
| Deleted assertions | Removing checks doesn't fix bugs |
| Test file deletion | Don't delete tests to make them "pass" |
| Empty catch blocks | Swallowing errors hides failures |
| Fresh TODOs | Defer work explicitly, not via comments |

## Hooks

### Pre-Commit Gate (PreToolUse: Bash)

Runs before any `git commit` command. Scans staged changes for violations.

**Blocks commit if:**
- Warning suppressions added
- Tests commented out
- Assertions deleted
- Test files deleted

### Phase-End Check (Stop)

Runs after each Claude response. Detects premature completion claims.

**Warns if Claude says "done" but:**
- Didn't actually run tests
- Dismissed warnings as unimportant
- Mentioned "for now" or "TODO"
- Deleted code instead of fixing

## Manual Check

Run the integrity check manually:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/integrity-check.sh"
```

## False Positives

Sometimes suppressions are legitimate. If blocked:

1. Explain WHY the suppression is necessary in the commit message
2. The explanation should convince a reviewer
3. If you can't explain it, fix the underlying issue instead
