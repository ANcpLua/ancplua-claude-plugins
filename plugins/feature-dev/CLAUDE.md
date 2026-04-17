# feature-dev

Guided feature development with 3 specialized agents, a 7-phase workflow command,
and integrated code review.

## Files

| File | Purpose |
|------|---------|
| `agents/code-architect.md` | Analyzes patterns, designs feature architecture, provides implementation blueprint |
| `agents/code-explorer.md` | Traces execution paths, maps abstraction layers, documents dependencies |
| `agents/code-reviewer.md` | Reviews for bugs, security, quality (confidence-based, only reports >=80%) |
| `commands/feature-dev.md` | `/feature-dev` command: 7-phase workflow |
| `commands/review.md` | `/review [target]` command: standalone code review with severity levels, checklist, and common vulnerability patterns |
| `scripts/runtime-state.sh` | Gitignored runtime cache for short-lived research and plan notes |

## 7-Phase Workflow

1. Discovery - understand requirements
2. Exploration - 2-3 agents analyze codebase in parallel
3. Clarifying Questions - ask user for missing details
4. Architecture Design - code-architect produces blueprint
5. Implementation - requires explicit user approval first
6. Quality Review - 3 agents review in parallel
7. Summary - final report

## Code Review (Standalone)

Use `/review [target]` for standalone reviews outside the feature-dev workflow:

- Uncommitted changes, specific file, directory, staged, branch
- Security audit, style check, performance review, best practices
- Severity: CRITICAL > HIGH > MEDIUM > LOW > INFO

## Notes

- Origin: Sid Bidasaria (Anthropic).
- Agents use opus model (Opus 4.7 default) with tools: Glob, Grep, LS, Read, NotebookRead, WebFetch, TodoWrite, WebSearch, KillShell, BashOutput. `effort: high` for reviewer/explorer/architect.
- Temporary research and plan notes live under `.feature-dev/`, not in tracked repo paths. Clear them when the workflow ends; stale state is auto-pruned on the next run.
