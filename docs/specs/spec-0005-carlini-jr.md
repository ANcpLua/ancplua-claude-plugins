# spec-0005: carlini-jr

Leaderless multi-agent harness with Playwright oracle.

## Origin

Nicholas Carlini's C compiler project: 16 parallel Claudes, no orchestrator, file locks for coordination, GCC as oracle. $20k API cost, 100k lines of Rust, compiles Linux 6.9.

Mario Zechner's Coding Agent Loop Specification: formalized the loop (steering, loop detection, execution environment abstraction, event system).

carlini-jr adapts both for qyl development: fewer agents, Playwright as oracle instead of GCC, DOD-driven instead of test-suite-driven.

## Design

### Invocation

```text
/carlini-jr build the dashboard with 3 charts and dark mode
```

No flags. Plugin infers:
- **DOD** from the prompt text
- **Scope** from the target repo's structure (CLAUDE.md, project layout)
- **Agent count** 4 default, user can say "use 6 agents" in the prompt
- **Oracle** Playwright MCP always

### Core loop per worker

```text
read DOD → check current_tasks/ for unclaimed items → lock one →
implement → run Playwright MCP → screenshot → check against DOD item →
if pass: remove lock, pick next
if fail: fix and retry
if all DOD items pass: done
```

### Coordination (Carlini pattern)

- No captain, no orchestrator
- File locks via `current_tasks/<item>.lock` — first writer wins
- Git worktrees for isolation (Claude Code native, not Docker)
- Agents self-select work based on what's unclaimed in the DOD
- Merge conflicts are expected — agents resolve them

### Oracle (Playwright MCP)

- Every DOD item is verified by Playwright navigating the running app
- Screenshots are the proof — not build output, not test results
- DOD is satisfied when every item has a passing screenshot

### Zechner patterns adopted

- **Loop detection** — if an agent makes the same 3 tool calls in a row, inject a steering message to try a different approach
- **Steering** — DOD updates mid-run are injected as steering messages to all active workers
- **Execution environment isolation** — worktrees provide filesystem isolation without Docker overhead
- **Event-driven** — progress reported via SendMessage between workers

### Agent count

| Agents | When |
|--------|------|
| 2 | Small tasks, 1-2 DOD items |
| 4 | Default. Most work. |
| 6 | Large features, 5+ DOD items |
| 8 | Maximum. Full-stack parallel work. |

Auto-scaled: `min(max(2, ceil(dod_items / 2)), 8)`

### What it is NOT

- Not exodia (no captain, no phases, no ceremony)
- Not agent-teams (no task delegation, no file ownership rules)
- Not a build system (Playwright is the oracle, not dotnet build)
- Not Docker-based (worktrees, not containers)

## Plugin structure

```text
plugins/ancplua/
├── .claude-plugin/plugin.json
├── CLAUDE.md
├── README.md
├── skills/
│   └── carlini-jr/
│       └── SKILL.md          # The launcher skill
└── agents/
    └── worker.md             # Worker agent template
```

## References

- Carlini blog: https://www.anthropic.com/engineering/building-c-compiler
- Carlini repo: https://github.com/anthropics/claudes-c-compiler
- Zechner spec: https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent
- Zechner blog: https://mariozechner.at/posts/2025-11-30-pi-coding-agent/
- Research HTML files: research/carlini/
