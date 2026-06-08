---
description: "Stop the active Charon ferry for this project — clears the state file so the Stop hook stops re-entering, and reports the last known PR status."
disable-model-invocation: true
allowed-tools: Bash, Read
---

# /charon:cancel — stop the ferry

Stop babysitting the current PR. This clears Charon's state file; the next time the
session stops, the Stop hook finds no state and lets it exit normally.

## Procedure

1. If `.claude/charon.local.md` does not exist, tell the user there is no active
   ferry and stop.

2. Otherwise read its frontmatter and report what you are stopping:
   ```bash
   sed -n '/^---$/,/^---$/{ /^---$/d; p; }' .claude/charon.local.md
   ```
   Surface the `pr`, `url`, `status`, and `iteration` so the user knows the last
   state before cancellation.

3. Remove the state file:
   ```bash
   rm -f .claude/charon.local.md
   ```

4. Confirm: the ferry for PR #N is cancelled; the PR itself is untouched (no branch,
   commit, or merge state was changed by cancelling). If a `/schedule` backstop was
   armed for this PR, remind the user it may still be active and how to remove it.
