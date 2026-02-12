# feature-dev

Guided feature development with codebase understanding, clean architecture focus, and integrated code review.

## Overview

7-phase workflow with 3 specialized agents for deep codebase analysis, architecture design,
and quality review. Includes standalone `/review` command for code review outside the full workflow.

## Phases

1. **Discovery** - Understand requirements
2. **Exploration** - 2-3 agents analyze codebase in parallel
3. **Clarifying Questions** - Fill in missing details
4. **Architecture Design** - code-architect produces blueprint
5. **Implementation** - Requires explicit user approval
6. **Quality Review** - 3 agents review in parallel
7. **Summary** - Final report

## Agents

| Agent | Role |
|-------|------|
| `code-architect` | Analyzes patterns, designs feature architecture, provides implementation blueprint |
| `code-explorer` | Traces execution paths, maps layers, documents dependencies |
| `code-reviewer` | Reviews for bugs, security, quality (confidence >=80% threshold) |

## Commands

| Command | Usage |
|---------|-------|
| `/feature-dev [description]` | Start the guided 7-phase workflow |
| `/review [target]` | Standalone code review (uncommitted changes, file, directory, staged, branch) |

## Code Review

The `/review` command provides comprehensive code review covering:

- Security audit (injection, auth, secrets, dependencies)
- Style check (naming, formatting, documentation)
- Performance review (N+1, memory, blocking)
- Best practices (error handling, DRY, SRP)

Severity levels: CRITICAL > HIGH > MEDIUM > LOW > INFO

## Usage

```bash
claude plugin install feature-dev@ancplua-claude-plugins
```

## License

MIT
