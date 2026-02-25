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

## Workflow

### 1. Gather Context

```bash
git diff --stat
git diff
```

Understand: purpose of changes, affected files, expected behavior.

### 2. Security Audit

Check for: injection vulnerabilities (SQL, command, XSS), authentication/authorization flaws,
hardcoded secrets, missing input validation, insecure dependencies.

Common patterns:

- **SQL injection** — Bad: string concatenation in queries. Good: parameterized queries.
- **XSS** — Bad: `innerHTML = userInput`. Good: `textContent = userInput`.
- **Missing error handling** — Bad: bare `JSON.parse(input)`. Good: try/catch with typed exceptions.

### 3. Style Check

Verify: naming conventions, formatting consistency, necessary documentation, logical file organization.

### 4. Performance Review

Look for: N+1 queries, unnecessary computation, memory issues, blocking operations in async contexts, inefficient algorithms.

### 5. Best Practices

Check: error handling, logging levels, test coverage, DRY principle, single responsibility.

### 6. Generate Report

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| `CRITICAL` | Security vulnerability, data loss | Must fix now |
| `HIGH` | Bugs, significant issues | Fix before merge |
| `MEDIUM` | Code quality, maintainability | Fix soon |
| `LOW` | Minor improvements | Nice to have |
| `INFO` | Observations, positive feedback | No action needed |

## Checklist

- [ ] Security vulnerabilities checked
- [ ] Code style verified
- [ ] Performance issues identified
- [ ] Error handling reviewed
- [ ] Test coverage assessed
- [ ] Report generated with findings

## Options

- `/review --security` - Focus on security issues only.
- `/review --style` - Focus on style issues only.
- `/review --performance` - Focus on performance only.
- `/review --verbose` - Include info-level findings.
- `/review --json` - Output as JSON for tooling.
