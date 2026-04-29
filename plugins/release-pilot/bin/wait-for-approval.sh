#!/usr/bin/env bash
set -euo pipefail

# wait-for-approval.sh <run-id> — like `gh run watch`, but designed for
# Pattern B (`environment: nuget` manual-approval gate).
#
# Polls `gh run view --json status,conclusion,url` every 15s. If the run
# enters `waiting` (publish job pending environment approval), prints the
# approval URL once on stderr and KEEPS polling so the orchestrator can
# resume automatically once the human approves in the GitHub UI.
#
# Stdout: final conclusion — `success`, `failure`, or `cancelled`
# Stderr: progress notes (including approval URL when seen)
# Exit:   0 on success, 1 on failure/cancelled, 2 on timeout
#
# Timeout default: 1800s (30 min). Override with WAIT_TIMEOUT_SEC.

RUN_ID="${1:?usage: wait-for-approval.sh <run-id>}"
TIMEOUT="${WAIT_TIMEOUT_SEC:-1800}"
POLL_INTERVAL="${WAIT_POLL_INTERVAL_SEC:-15}"

START=$(date +%s)
URL_PRINTED=0

while true; do
  if ! JSON=$(gh run view "$RUN_ID" --json status,conclusion,url 2>/dev/null); then
    echo "ERROR: failed to fetch run $RUN_ID" >&2
    exit 1
  fi

  STATUS=$(echo "$JSON" | jq -r '.status // ""')
  CONCLUSION=$(echo "$JSON" | jq -r '.conclusion // ""')
  RUN_URL=$(echo "$JSON" | jq -r '.url // ""')

  case "$STATUS" in
    completed)
      echo "Run $RUN_ID completed: $CONCLUSION" >&2
      echo "$CONCLUSION"
      [ "$CONCLUSION" = "success" ] && exit 0 || exit 1
      ;;
    waiting)
      if [ "$URL_PRINTED" -eq 0 ]; then
        cat >&2 <<EOF

  ┌─────────────────────────────────────────────────────────────┐
  │  APPROVAL NEEDED — publish job is paused on the              │
  │  \`nuget\` environment gate. Approve in the GitHub UI:         │
  │                                                              │
  │  $RUN_URL
  │                                                              │
  │  Polling will resume automatically once you approve.         │
  └─────────────────────────────────────────────────────────────┘

EOF
        URL_PRINTED=1
      fi
      ;;
    in_progress|queued|requested|pending)
      # build phase or post-approval publish phase — keep polling silently
      ;;
    *)
      echo "WARN: unexpected run status: '$STATUS'" >&2
      ;;
  esac

  NOW=$(date +%s)
  ELAPSED=$((NOW - START))
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "TIMEOUT after ${ELAPSED}s waiting for run $RUN_ID (status=$STATUS)" >&2
    [ -n "$RUN_URL" ] && echo "Run URL: $RUN_URL" >&2
    exit 2
  fi

  sleep "$POLL_INTERVAL"
done
