---
name: smart-hades-stop-guard
enabled: false
event: stop
action: block
conditions:
  - field: transcript
    operator: not_contains
    pattern: HADES CLEANUP REPORT
---

**Smart-Hades Stop Guard — Cleanup report not found!**

When enabled, blocks session completion unless a `HADES CLEANUP REPORT`
is present in the transcript. This ensures cleanup was actually performed
before claiming done.

**Disabled by default.** Enable for strict enforcement sessions where
cleanup completion is a hard requirement.

**To enable:** Set `enabled: true` above or run `/hookify:configure`.
