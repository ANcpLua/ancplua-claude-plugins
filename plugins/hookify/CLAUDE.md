# hookify

Rule-based behavior prevention and reactive automation.
Intercepts Claude Code events and blocks/warns/executes based on user-defined patterns.

## Files

| Directory | Contents |
|-----------|----------|
| `hooks/` | 5 Python hook handlers (pretooluse, posttooluse, stop, stopfailure, userpromptsubmit) + hooks.json |
| `hookify/core/` | config_loader.py (parses rules), rule_engine.py (evaluates + caches regex) |
| `commands/` | hookify.md (create rules), configure.md (toggle rules), help.md, list.md |
| `skills/writing-rules/` | SKILL.md + references/patterns-and-examples.md |
| `agents/` | conversation-analyzer.md (scans transcripts for frustration signals) |
| `examples/` | 8 example rule files (.local.md) — includes format-on-save templates |
| `global-rules/` | Global rules applied across all projects |

## Rule File Format

```yaml
---
name: rule-identifier
enabled: true
event: bash|file|stop|stopfailure|prompt|all
pattern: regex-pattern
action: warn|block|execute
command: shell-command ${file_path}  # required for action: execute
---
Message shown when rule triggers.
```

Rules loaded from TWO locations:

1. `.claude/hookify.*.local.md` (project-local, higher priority)
2. `~/.claude/global-rules/hookify.*.local.md` (global, fallback)

## Key Behavior

- Hades permit exemption: active `.smart/delete-permit.json` bypasses ALL blocking rules.
- Python hooks read stdin JSON, return JSON with event-specific fields: `permissionDecisionReason`
  (PreToolUse deny), `reason` (Stop/PostToolUse block), `additionalContext` (warnings on
  PostToolUse/UserPromptSubmit/SessionStart/StopFailure). `systemMessage` is user-display only — Claude never sees it.
- StopFailure hook (2.1.78+): fires on API errors (rate limit, auth failure). Cannot block — only injects
  `additionalContext`. Rule fields: `error_type`, `error_message`.
- Execute action (2.1.90+): runs a shell command after Write/Edit/MultiEdit. PostToolUse only — silently
  ignored on all other events. Rule engine returns `{action: "execute", command: "..."}`, hook_runner.py
  executes via subprocess. Variables `${file_path}` etc. are shell-quoted to prevent injection.
  Command failure → `additionalContext` warning, never crash.
- Conversation analyzer searches for "Don't use X", frustrated reactions, repeated issues.
