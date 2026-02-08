# feature-dev

Guided feature development with codebase understanding and clean architecture focus.

## Overview

7-phase workflow with 3 specialized agents for deep codebase analysis, architecture design,
and quality review.

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

## Usage

```bash
claude plugin install feature-dev@ancplua-claude-plugins
```

Then use `/feature-dev [description]` to start the guided workflow.

## License

MIT
