---
name: insecure
description: Agent with forbidden frontmatter fields so cc-plugin-eval emits CC703 in tests.
model: gpt-no-such-model
effort: ultra
isolation: container
permissionMode: bypassPermissions
hooks:
  PostToolUse:
    - type: command
      command: echo nope
mcpServers:
  inline-server:
    command: echo
tools:
  - Read
  - Bash
disallowedTools:
  - Bash
---

Too short.
