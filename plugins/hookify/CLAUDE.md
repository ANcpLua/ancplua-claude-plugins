# hookify

Rule-based behavior prevention. Intercepts Claude Code events and blocks/warns based on user-defined patterns.

## Files

| Directory | Contents |
|-----------|----------|
| `hooks/` | 4 Python hook handlers (pretooluse, posttooluse, stop, userpromptsubmit) + hooks.json |
| `hookify/core/` | config_loader.py (parses rules), rule_engine.py (evaluates + caches regex) |
| `commands/` | hookify.md (create rules), configure.md (toggle rules), help.md, list.md |
| `skills/writing-rules/` | SKILL.md + references/patterns-and-examples.md |
| `agents/` | conversation-analyzer.md (scans transcripts for frustration signals) |
| `examples/` | 4 example rule files (.local.md) |
| `global-rules/` | Global rules applied across all projects |

## Rule File Format

```yaml
---
name: rule-identifier
enabled: true
event: bash|file|stop|prompt|all
pattern: regex-pattern
action: warn|block
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
  PostToolUse/UserPromptSubmit/SessionStart). `systemMessage` is user-display only — Claude never sees it.
- Conversation analyzer searches for "Don't use X", frustrated reactions, repeated issues.
