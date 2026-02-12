---
name: review
description: Perform a comprehensive code review on specified files or changes
---

Review code for security vulnerabilities, style issues, performance problems, and best practices.

## Usage

```text
/review [target]
```

## Targets

- `/review` - Review all uncommitted changes.
- `/review file.ts` - Review a specific file.
- `/review src/` - Review all files in a directory.
- `/review --staged` - Review only staged changes.
- `/review --branch=feature` - Review changes in a branch.

## Behavior

1. Gather the target files or changes.
2. Perform security audit.
3. Check code style and conventions.
4. Analyze performance implications.
5. Review error handling and best practices.
6. Generate a summary report.

## Example output

```text
Reviewing changes...

Files analyzed: 5
Lines reviewed: 342

## Security Issues

### HIGH: SQL injection risk

Location: src/api/users.ts:42
Code: const query = `SELECT * FROM users WHERE id = ${id}`;
Suggestion: Use parameterized queries.

## Style Issues

### MEDIUM: Function too long

Location: src/services/auth.ts:89
The authenticateUser function is 87 lines.
Suggestion: Extract helper functions.

## Performance Issues

### LOW: N+1 query pattern

Location: src/api/posts.ts:23
Posts are fetched in a loop.
Suggestion: Use eager loading or batch queries.

## Summary

- Critical: 0
- High: 1
- Medium: 1
- Low: 1
- Info: 2

Recommendation: Address high-severity issues before merging.
```

## Options

- `/review --security` - Focus on security issues only.
- `/review --style` - Focus on style issues only.
- `/review --performance` - Focus on performance only.
- `/review --verbose` - Include info-level findings.
- `/review --json` - Output as JSON for tooling.
