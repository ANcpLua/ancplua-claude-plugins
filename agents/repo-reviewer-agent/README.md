# repo-reviewer-agent

Autonomous repository health reviewer built with the Claude Agent SDK.

## Status

**Planned** - This agent is in the design phase.

## Purpose

The `repo-reviewer-agent` performs comprehensive repository health checks:

- Structure compliance with conventions.
- Documentation completeness.
- Code quality metrics.
- Dependency health.
- Security posture.

## Capabilities

### Structure Review

- Verifies directory layout matches expected patterns.
- Checks for required files (README, LICENSE, etc.).
- Identifies misplaced or orphaned files.

### Documentation Audit

- Checks README completeness.
- Verifies API documentation.
- Identifies missing specs and ADRs.
- Reviews changelog maintenance.

### Code Quality

- Runs linters and formatters.
- Checks test coverage.
- Identifies code smells.
- Reviews error handling patterns.

### Dependency Health

- Checks for outdated dependencies.
- Identifies security vulnerabilities.
- Reviews license compliance.
- Suggests update priorities.

### Security Posture

- Scans for secrets in code.
- Reviews authentication patterns.
- Checks for common vulnerabilities.
- Audits CI/CD security.

## Architecture

```text
┌──────────────────────────────────────┐
│        repo-reviewer-agent           │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────┐  ┌──────────────┐  │
│  │   Plugins    │  │    Skills    │  │
│  │              │  │              │  │
│  │ code-review  │  │ Review       │  │
│  │ autonomous-ci│  │ Checklist    │  │
│  └──────────────┘  └──────────────┘  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │         MCP Servers          │    │
│  │  Filesystem  │  GitHub API   │    │
│  └──────────────────────────────┘    │
│                                      │
└──────────────────────────────────────┘
```

## Planned Integration

### Plugins Used

- `code-review` - For code quality checks.
- `autonomous-ci` - For CI verification.

### MCP Servers

- Filesystem server for reading files.
- GitHub API for PR and issue integration.

## Configuration

Configuration will be in `config/agent.json`:

```json
{
  "name": "repo-reviewer-agent",
  "version": "0.1.0",
  "plugins": ["code-review", "autonomous-ci"],
  "checks": {
    "structure": true,
    "documentation": true,
    "codeQuality": true,
    "dependencies": true,
    "security": true
  },
  "output": {
    "format": "markdown",
    "destination": "stdout"
  }
}
```

## Usage (Planned)

```bash
# Review current repository
repo-reviewer-agent review .

# Review with specific checks
repo-reviewer-agent review . --checks=structure,documentation

# Output as JSON
repo-reviewer-agent review . --format=json

# Generate report file
repo-reviewer-agent review . --output=report.md
```

## Output (Planned)

```text
# Repository Health Report

## Summary
- Overall Score: 85/100
- Critical Issues: 0
- Warnings: 3
- Suggestions: 7

## Structure (95/100)
✓ Directory layout follows conventions
✓ Required files present
⚠ Consider adding CONTRIBUTING.md

## Documentation (80/100)
✓ README is comprehensive
✓ API documentation exists
⚠ Missing ADR for auth decision
⚠ Changelog not updated recently

## Code Quality (90/100)
✓ Linting passes
✓ Tests pass
⚠ Coverage at 75% (target: 80%)

## Dependencies (85/100)
✓ No critical vulnerabilities
⚠ 3 minor updates available

## Security (80/100)
✓ No secrets detected
✓ Authentication patterns OK
⚠ Consider adding security policy
```

## Development

### Directory Structure

```text
agents/repo-reviewer-agent/
├── README.md
├── config/
│   └── agent.json
├── src/
│   ├── index.ts
│   ├── checks/
│   │   ├── structure.ts
│   │   ├── documentation.ts
│   │   ├── codeQuality.ts
│   │   ├── dependencies.ts
│   │   └── security.ts
│   └── reporters/
│       ├── markdown.ts
│       └── json.ts
├── prompts/
│   └── system.md
└── tests/
    └── checks.test.ts
```

### Getting Started

1. Implement core check modules.
2. Create Agent SDK configuration.
3. Add plugin integrations.
4. Write tests.
5. Document usage.

## License

MIT
