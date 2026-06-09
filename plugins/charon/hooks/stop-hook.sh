#!/bin/bash
#
# Charon Stop Hook — the resume net.
#
# Fires whenever the session tries to stop. Decides, purely from the state
# file's `status:` field (NEVER from the clock), whether to:
#
#   - re-enter   the ferry loop, because work is still ACTIONABLE
#                (working / ci-failed / conflict / behind / review-changes)
#   - allow stop and rest, because we are deliberately WAITING on CI
#                (ci-running) — a ScheduleWakeup paces the resume
#   - allow stop and finish, because the PR reached a TERMINAL state
#                (merged / closed / needs-you)
#
# Because control flow branches only on `status:` — never on a timestamp — a
# system-clock change, laptop sleep, or timezone swap cannot corrupt it. The
# worst a missed wakeup can do is leave us rested in `ci-running`; re-running
# `/charon <pr>` (or an armed `/schedule` backstop) resumes deterministically.
#
# Modeled on the battle-tested ralph-loop stop hook (same defensive parsing,
# same atomic state writes, same session isolation), specialised for the PR
# ferry's tri-state status machine.

set -euo pipefail

HOOK_INPUT=$(cat)

STATE_FILE=".claude/charon.local.md"

# No active ferry → never interfere with a normal stop.
if [[ ! -f "$STATE_FILE" ]]; then
  exit 0
fi

# --- Parse frontmatter (YAML between the first two --- fences) ---
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$STATE_FILE")
# `|| true`: a MISSING frontmatter line makes grep exit 1, which under
# `set -euo pipefail` would abort the whole script at the assignments below —
# silently, before the corruption guard could run. With `|| true`, a missing
# numeric field falls through to that guard (clean removal + message), and a
# missing status falls through to the safe ACTIONABLE default (re-enter, never
# silently idle). Without it, field-line corruption killed the hook with RC=1
# and left the bad file in place — a claim-vs-behaviour gap, not an infinite loop.
get() { echo "$FRONTMATTER" | grep "^$1:" | head -n1 | sed "s/^$1: *//" | sed 's/^"\(.*\)"$/\1/' || true; }

ITERATION=$(get iteration)
MAX_ITERATIONS=$(get max_iterations)
STATUS=$(get status)
PR=$(get pr)
STATE_SESSION=$(get session_id)
HOOK_SESSION=$(echo "$HOOK_INPUT" | jq -r '.session_id // ""')

# --- Session ownership ---
# The state file is project-scoped, but the Stop hook fires in EVERY session in
# this project. First session to fire claims the ferry by stamping its id; other
# sessions then see a mismatch and step aside. (Honors concurrent-session reality.)
if [[ -z "$STATE_SESSION" ]]; then
  if [[ -n "$HOOK_SESSION" ]]; then
    TMP="${STATE_FILE}.tmp.$$"
    sed "s/^session_id:.*/session_id: $HOOK_SESSION/" "$STATE_FILE" > "$TMP" && mv "$TMP" "$STATE_FILE"
    STATE_SESSION="$HOOK_SESSION"
  fi
elif [[ "$STATE_SESSION" != "$HOOK_SESSION" ]]; then
  # Another session owns this ferry. Do not block, do not touch the file.
  exit 0
fi

# --- Validate numerics before any arithmetic (corruption → stop cleanly) ---
if [[ ! "$ITERATION" =~ ^[0-9]+$ ]] || [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "⚠️  Charon: state file corrupted (non-numeric iteration/max_iterations)." >&2
  echo "   File: $STATE_FILE — removing it. Re-run /charon to restart the ferry." >&2
  rm -f "$STATE_FILE"
  exit 0
fi

# --- TERMINAL: PR is done, or genuinely needs a human. Finish the ferry. ---
case "$STATUS" in
  merged|closed|needs-you)
    echo "⚓ Charon: ferry for PR #$PR ended (status: $STATUS). State cleared." >&2
    rm -f "$STATE_FILE"
    exit 0
    ;;
esac

# --- WAIT: deliberately resting on CI. Allow the stop; the wakeup resumes us. ---
# (Keep the state file — the ferry is still active, just paced.)
case "$STATUS" in
  ci-running)
    echo "🟡 Charon: PR #$PR — CI in flight. Resting; a wakeup will resume the ferry. Not stuck." >&2
    exit 0
    ;;
esac

# --- Runaway guard for ACTIONABLE re-entries ---
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -ge $MAX_ITERATIONS ]]; then
  echo "🛑 Charon: hit max_iterations ($MAX_ITERATIONS) for PR #$PR (last status: ${STATUS:-unknown})." >&2
  echo "   Stopping so I do not churn. Re-run /charon:charon to continue, or /charon:charon cancel to clear." >&2
  rm -f "$STATE_FILE"
  exit 0
fi

# --- ACTIONABLE: real work remains. Re-enter the ferry with the same prompt. ---
# Extract the babysit prompt (everything after the second --- fence).
PROMPT_TEXT=$(awk '/^---$/{i++; next} i>=2' "$STATE_FILE")
if [[ -z "$PROMPT_TEXT" ]]; then
  echo "⚠️  Charon: state file has no prompt body — removing it. Re-run /charon." >&2
  rm -f "$STATE_FILE"
  exit 0
fi

# Bump the iteration counter atomically.
NEXT_ITERATION=$((ITERATION + 1))
TMP="${STATE_FILE}.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$STATE_FILE" > "$TMP" && mv "$TMP" "$STATE_FILE"

SYSTEM_MSG="⛵ Charon iteration $NEXT_ITERATION | PR #$PR (status: ${STATUS:-working}) — actionable work remains, continuing the ferry."

# Block the stop and feed the ferry prompt back in.
jq -n \
  --arg prompt "$PROMPT_TEXT" \
  --arg msg "$SYSTEM_MSG" \
  '{ "decision": "block", "reason": $prompt, "systemMessage": $msg }'

exit 0
