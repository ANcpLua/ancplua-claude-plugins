# code-review

Automated code review with security scanning, style checking, and improvement suggestions.

## Overview

The `code-review` plugin enables Claude to perform comprehensive code reviews by:

- Scanning for security vulnerabilities.
- Checking code style and conventions.
- Identifying performance issues.
- Suggesting improvements and best practices.
- Catching common bugs and anti-patterns.

## Installation

```text
/plugin marketplace add ANcpLua/ancplua-claude-plugins
/plugin install code-review@ancplua-claude-plugins
```

## Features

### Security Scanning

Detects common security issues:

- SQL injection vulnerabilities.
- Cross-site scripting (XSS).
- Insecure dependencies.
- Hardcoded secrets.
- Authentication flaws.

### Style Checking

Ensures code follows conventions:

- Language-specific style guides.
- Project-specific rules.
- Naming conventions.
- Documentation requirements.

### Performance Analysis

Identifies performance concerns:

- N+1 queries.
- Unnecessary iterations.
- Memory leaks.
- Blocking operations.

### Improvement Suggestions

Provides actionable recommendations:

- Refactoring opportunities.
- Modern language features.
- Better abstractions.
- Test coverage gaps.

## Usage

### Skill Usage

```text
I'm using the code-review skill to review these changes.

Reviewing changes in src/api/users.ts...

Security Issues:
- HIGH: SQL injection vulnerability at line 42
  Suggestion: Use parameterized queries

Style Issues:
- MEDIUM: Function `getUserData` exceeds 50 lines
  Suggestion: Extract helper functions

Performance Issues:
- LOW: N+1 query pattern in user list endpoint
  Suggestion: Use eager loading

Overall: 1 high, 1 medium, 1 low severity issues found.
```

### Command Usage

```text
/review [file or directory]
```

## Skill: code-review

The `code-review` Skill provides:

1. **Security Audit:** Scans for vulnerabilities.
2. **Style Check:** Validates code conventions.
3. **Performance Review:** Identifies bottlenecks.
4. **Suggestions:** Provides improvement recommendations.
5. **Report Generation:** Creates review summary.

See `skills/code-review/SKILL.md` for full Skill documentation.

## Review Checklist

The Skill follows a structured checklist:

- [ ] Security vulnerabilities checked.
- [ ] Code style validated.
- [ ] Performance concerns identified.
- [ ] Test coverage assessed.
- [ ] Documentation reviewed.
- [ ] Error handling verified.

## Severity Levels

- **CRITICAL:** Must fix before merge.
- **HIGH:** Should fix before merge.
- **MEDIUM:** Should fix soon.
- **LOW:** Nice to have.
- **INFO:** Informational note.

## Integration

### With autonomous-ci

1. Make changes.
2. Use `code-review` to check quality.
3. Fix issues found.
4. Use `autonomous-ci` to verify.

## Configuration

The plugin respects project configuration:

- `.eslintrc` - JavaScript/TypeScript rules.
- `.stylelintrc` - CSS rules.
- `.editorconfig` - Editor settings.
- Custom rules in project config.

## Requirements

- Claude Code with plugin support.
- Project files to review.

## License

MIT
