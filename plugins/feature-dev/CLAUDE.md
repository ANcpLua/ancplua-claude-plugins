# feature-dev

Guided feature development with 3 specialized agents and a 7-phase workflow command.

## Files

| File | Purpose |
|------|---------|
| `agents/code-architect.md` | Analyzes patterns, designs feature architecture, provides implementation blueprint |
| `agents/code-explorer.md` | Traces execution paths, maps abstraction layers, documents dependencies |
| `agents/code-reviewer.md` | Reviews for bugs, security, quality (confidence-based, only reports >=80%) |
| `commands/feature-dev.md` | `/feature-dev` command: 7-phase workflow |

## 7-Phase Workflow

1. Discovery - understand requirements
2. Exploration - 2-3 agents analyze codebase in parallel
3. Clarifying Questions - ask user for missing details
4. Architecture Design - code-architect produces blueprint
5. Implementation - requires explicit user approval first
6. Quality Review - 3 agents review in parallel
7. Summary - final report

## Notes

- Origin: Sid Bidasaria (Anthropic). Maintained as-is.
- Agents use sonnet model with tools: Glob, Grep, LS, Read, NotebookRead, WebFetch, TodoWrite, WebSearch, KillShell, BashOutput.
- No hooks or skills. Command + agents only.
