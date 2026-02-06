---
name: smart-hades-delete-guard
enabled: true
event: bash
pattern: \b(rm\s|git\s+rm|git\s+clean|git\s+reset\s+--hard)\b
action: block
---

**Smart-Hades Delete Guard — Destructive command blocked!**

Deletions must flow through the Hades pipeline so they get a Smart ID,
a deletion permit, and an audit ledger entry.

Direct `rm`, `git rm`, `git clean`, or `git reset --hard` bypasses all
safety infrastructure.

**What to do instead:** Run `/hades <scope>` to perform cleanup through
the audited pipeline with deletion permits and ledger tracking.

**To disable:** Set `enabled: false` above or run `/hookify:configure`.
