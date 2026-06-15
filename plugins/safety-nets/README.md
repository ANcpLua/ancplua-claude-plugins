# safety-nets

Two deterministic **Stop-event** safety nets (no LLM) that keep a session honest. Both fire at most once per turn and either allow the stop or block once with a specific reason.

## Hooks

### `overclaim-net` (`hooks/overclaim-net.sh`)
Blocks once when the final assistant message asserts a **result** — `done` / `fertig` / `ready` / `fixed` / `works` / `passing` / `complete` / `verified` (and German equivalents) — but **no evidence-producing tool ran this turn** to back it. Evidence = something that ran or observed behavior: `Bash` / `BashOutput`, a subagent (`Task` / `Agent`), a `Workflow`, or any MCP tool (`mcp__*`) — a static `Read` or an unverified `Edit` does **not** count. Forces you to either show the verification output or downgrade the wording to "done, but not verified." Deliberately omits ambiguous words like *test*.

The turn boundary is the last **genuine human** message. Tool results are themselves recorded as `type:"user"` rows (they carry a `toolUseResult` payload), so they are excluded — otherwise the turn window would start *after* the last command and the hook would never see the `tool_use` that backs the claim, firing on nearly every honest "ran a command, then reported the result" turn.

### `slnx-sync` (`hooks/slnx-sync-check.sh`)
Blocks once when a `.csproj` on disk (excluding `bin`/`obj` and `dotnet new` template content) is **not registered** in the repo's nearest `.slnx`. Enforces "register your new projects in the solution yourself."

It **skips** when the repo is an upstream / VMR-synced fork whose solution is curated upstream — detected by any of:
- a `.slnx-sync-ignore` file at the project root (explicit per-repo opt-out),
- VMR codeflow in recent history (`Source code updates from dotnet/dotnet` / `dotnet-maestro`),
- an `upstream` remote pointing at `github.com/dotnet/…`.

This prevents false-flagging deliberate upstream exclusions (e.g. dotnet/aspnetcore omits `*InvalidSignature` host fixtures, internal & packaging projects, runtime-shared tests).

## Install

Enable from the `ancplua-claude-plugins` marketplace:

```
/plugin   # enable safety-nets@ancplua-claude-plugins
```

or in `~/.claude/settings.json`:

```json
{ "enabledPlugins": { "safety-nets@ancplua-claude-plugins": true } }
```

Hooks load at session start — **restart Claude Code** after enabling. Verify with `/hooks` (you should see two `Stop` hooks from `safety-nets`).

## Notes

- Both hooks read their input as JSON on stdin and emit `{"decision":"block","reason":…}` only when they fire; otherwise they exit silently.
- `slnx-sync` uses `$CLAUDE_PROJECT_DIR`; `overclaim-net` reads `transcript_path`. Both are deterministic and dependency-free (POSIX `bash` + `python3`).
- These were previously loose scripts under `~/.claude/hooks/`; this plugin is their versioned, installable home.
