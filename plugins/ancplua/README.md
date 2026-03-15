# ancplua

Agent operating system — leaderless multi-agent swarms with Playwright oracle.

## Usage

```text
/ancplua:carlini-jr build a dashboard with sidebar navigation and 3 data charts
```

That's it. Everything else is defaults.

## What Happens

1. Your prompt becomes a Definition of Done (DOD)
2. Workers are auto-scaled (2-8) based on DOD item count
3. Each worker runs in an isolated git worktree
4. Workers self-select tasks via file locks — no orchestrator
5. Every DOD item is verified by Playwright MCP screenshots
6. Code is opaque — only observable behavior matters

## Override Agent Count

```text
/ancplua:carlini-jr use 6 agents — build the full admin panel with auth, user table, settings, charts, notifications, and audit log
```

## Philosophy

Inspired by:

- **Carlini** — 16 parallel Claudes built a C compiler with no orchestrator, file locks, GCC as oracle
- **Zechner** — formalized agent loop (steering, loop detection, execution environment abstraction)
- **Alexander's framework** — Seed, Validation Diamond, Apply More Tokens, Playwright as truth

## Skills

| Skill | Description |
|-------|-------------|
| `carlini-jr` | Leaderless swarm launcher with Playwright oracle |
