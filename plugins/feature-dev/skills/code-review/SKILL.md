---
name: code-review
description: Perform comprehensive code reviews covering security, style, performance, and best practices. Use when reviewing code changes before commit or merge, auditing existing code, or checking for vulnerabilities.
---

# Code Review

Comprehensive code review covering security, style, performance, and best practices.

## When to Use

- Reviewing code changes before commit or merge
- Auditing existing code for issues
- Checking for security vulnerabilities

## Review Workflow

### 1. Gather Context

```bash
git diff --stat
git diff
```

Understand: purpose of changes, affected files, expected behavior.

### 2. Security Audit

Check for: injection vulnerabilities (SQL, command, XSS), authentication/authorization flaws,
hardcoded secrets, missing input validation, insecure dependencies.

### 3. Style Check

Verify: naming conventions, formatting consistency, necessary documentation, logical file organization.

### 4. Performance Review

Look for: N+1 queries, unnecessary computation, memory issues, blocking operations in async contexts, inefficient algorithms.

### 5. Best Practices

Check: error handling, logging levels, test coverage, DRY principle, single responsibility.

### 6. Generate Report

```text
## Code Review Summary

### Critical (must fix)
### High (should fix)
### Medium (consider fixing)
### Low (nice to have)
### Info
```

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

See `references/` for common vulnerability patterns with examples.
