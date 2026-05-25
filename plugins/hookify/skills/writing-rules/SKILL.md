---
name: writing-rules
description: "IF creating hookify rules THEN use this. IF blocking a dangerous bash command THEN this. IF preventing API-key writes to .env THEN this. IF requiring tests before stop THEN this. IF gating Edit/Write on specific paths THEN this. IF API rate-limit alerts on stopfailure THEN this. Generates .claude/hookify.*.local.md files with event matchers (bash|file|stop|stopfailure|prompt|all) and condition operators (regex_match, contains, equals, starts_with, ends_with, not_contains). Rule actions: warn (default) or block."
allowed-tools: Read, Write, Edit, Glob, Grep
effort: medium
---

# Writing Hookify Rules

## When to Use

- User asks to create, write, or configure hookify rules
- User wants to prevent specific behaviors in Claude Code

## Process

1. **Identify the behavior** to prevent
2. **Choose the event type** (bash, file, stop, prompt, all)
3. **Write the pattern** (regex or conditions)
4. **Create the rule file** in `.claude/hookify.{name}.local.md`
5. **Test immediately** — rules take effect on next tool use

## Rule File Format

```markdown
---
name: rule-identifier
enabled: true
event: bash|file|stop|stopfailure|prompt|all
pattern: regex-pattern-here
---

Message shown to Claude when rule triggers.
```

## Event Types

| Event | Matches Against | Use For |
|-------|----------------|---------|
| `bash` | Command text | Dangerous commands, privilege escalation |
| `file` | File path + content | Debug code, sensitive files, security risks |
| `stop` | Always (use `.*`) | Completion checklists, required steps |
| `stopfailure` | `error_type`, `error_message` | API error alerts, rate limit handling |
| `prompt` | User prompt text | Deployment gates, process enforcement |
| `all` | All events | Cross-cutting concerns |

**Event-to-tool mapping:** `bash` events fire on `Bash` tool calls; `file` events fire on `Read`, `Write`, `Edit`, and `NotebookEdit` tool calls; `prompt` events fire when the user submits input; `stop` / `stopfailure` fire when Claude attempts to halt.

## Actions

- `warn` (default): Show message, allow operation
- `block`: Prevent operation entirely

## Advanced: Multiple Conditions

```yaml
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$
  - field: new_text
    operator: contains
    pattern: API_KEY
```

**Operators:** `regex_match`, `contains`, `equals`, `not_contains`, `starts_with`, `ends_with`

**Fields:** bash → `command` | file → `file_path`, `new_text`, `old_text`, `content` | prompt → `user_prompt`

All conditions must match for the rule to trigger.

## File Organization

- **Location:** `.claude/hookify.{descriptive-name}.local.md`
- **Gitignore:** Add `.claude/*.local.md` to `.gitignore`
- **Naming:** Start with verb: `warn-dangerous-rm`, `block-console-log`, `require-tests`

See `references/` for regex patterns, examples, and common pitfalls.

## If Connectors Available

- ~~github~~ Commit generated rule files and open a PR for team review
- ~~slack~~ Notify the team when a new blocking rule is added to the project
- ~~linear~~ Track rule creation as a task linked to the behavior it guards against
