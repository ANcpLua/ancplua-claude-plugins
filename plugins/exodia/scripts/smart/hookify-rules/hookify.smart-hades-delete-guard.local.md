---
name: smart-hades-delete-guard
enabled: true
event: PreToolUse
action: block
conditions:
  tool: Bash
  command_pattern: "\\b(rm\\s|git\\s+rm|git\\s+clean|git\\s+reset\\s+--hard)\\b"
---

# Smart-Hades Delete Guard

Blocks destructive file operations that bypass the Smart-Hades deletion pipeline.

**Why:** Deletions must flow through Hades so they get a Smart ID, a deletion permit,
and an audit ledger entry. Direct `rm`, `git rm`, `git clean`, or `git reset --hard`
bypasses all safety infrastructure.

**What to do instead:** Run the hades skill (`/hades <scope>`) to perform cleanup
through the audited pipeline with deletion permits and ledger tracking.

**To disable:** Set `enabled: false` above or run `/hookify:configure`.
