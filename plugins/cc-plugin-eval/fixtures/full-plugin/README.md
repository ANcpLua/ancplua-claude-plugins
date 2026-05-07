# full-plugin fixture

Fixture plugin for `cc-plugin-eval` tests. Exercises every Claude Code component:

- `.claude-plugin/plugin.json` (with `userConfig`, `channels`, `dependencies`)
- `skills/` (one valid skill)
- `agents/` (one valid agent with `isolation: worktree`)
- `hooks/hooks.json` (`PostToolUse` and `SessionStart`)
- `.mcp.json`
- `.lsp.json`
- `monitors/monitors.json`
- `themes/`
- `scripts/` referenced by hooks and monitors
- `servers/` referenced by `.mcp.json`

Used by `tests/cc-plugin-eval.test.js` to confirm `validate --strict` exits 0 with no error or warn findings.
