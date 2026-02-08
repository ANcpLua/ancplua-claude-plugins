# code-review

Automated code review with security scanning, style checking, and improvement suggestions.

## Files

| File | Purpose |
|------|---------|
| `skills/code-review/SKILL.md` | 6-step review workflow with severity levels |
| `skills/code-review/references/common-patterns.md` | 5 vulnerability patterns with bad/good examples |
| `commands/review.md` | `/review [target]` command with targeting modes and flags |

## How It Works

1. Gather context via `git diff`
2. Security audit (injection, auth, secrets, dependencies)
3. Style check (naming, formatting, documentation)
4. Performance review (N+1, memory, blocking)
5. Best practices (error handling, DRY, SRP)
6. Report with severity: CRITICAL > HIGH > MEDIUM > LOW > INFO

## Notes

- Claude follows the SKILL.md checklist automatically when invoked.
- The `/review` command supports: uncommitted changes, specific file, directory, staged, branch.
