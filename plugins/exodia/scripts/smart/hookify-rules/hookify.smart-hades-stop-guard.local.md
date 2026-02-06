---
name: smart-hades-stop-guard
enabled: false
event: Stop
action: block
conditions:
  transcript_must_contain: "HADES CLEANUP REPORT"
---

# Smart-Hades Stop Guard (Opt-in)

When enabled, blocks session completion unless a `HADES CLEANUP REPORT` is present
in the transcript. This ensures cleanup was actually performed before claiming done.

**Disabled by default.** Enable this for strict enforcement sessions where cleanup
completion is a hard requirement.

**To enable:** Set `enabled: true` above or run `/hookify:configure`.
