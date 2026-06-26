# safety-nets

One deterministic **Stop-event** safety net (no LLM) that keeps a session honest. It fires at most once per turn and either allows the stop or blocks once with a specific reason.

## Hooks

### `overclaim-net` (`hooks/overclaim-net.sh`)
Blocks once when the final assistant message asserts a **result** — `done` / `fertig` / `ready` / `fixed` / `works` / `passing` / `complete` / `verified` (and German equivalents) — but **no evidence-producing tool ran this turn** to back it. Evidence = something that ran or observed behavior: `Bash` / `BashOutput`, a subagent (`Task` / `Agent`), a `Workflow`, or any MCP tool (`mcp__*`) — a static `Read` or an unverified `Edit` does **not** count. Forces you to either show the verification output or downgrade the wording to "done, but not verified." Deliberately omits ambiguous words like *test*.

The turn boundary is the last **genuine human** message. Tool results are themselves recorded as `type:"user"` rows (they carry a `toolUseResult` payload), so they are excluded — otherwise the turn window would start *after* the last command and the hook would never see the `tool_use` that backs the claim, firing on nearly every honest "ran a command, then reported the result" turn.

## Install

Enable from the `ancplua-claude-plugins` marketplace:

```
/plugin   # enable safety-nets@ancplua-claude-plugins
```

or in `~/.claude/settings.json`:

```json
{ "enabledPlugins": { "safety-nets@ancplua-claude-plugins": true } }
```

Hooks load at session start — **restart Claude Code** after enabling. Verify with `/hooks` (you should see one `Stop` hook from `safety-nets`).

## Notes

- The hook reads its input as JSON on stdin and emits `{"decision":"block","reason":…}` only when it fires; otherwise it exits silently.
- `overclaim-net` reads `transcript_path`. Deterministic and dependency-free (POSIX `bash` + `python3`).
- These were previously loose scripts under `~/.claude/hooks/`; this plugin is their versioned, installable home.
