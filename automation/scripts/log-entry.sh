#!/usr/bin/env bash
# automation/scripts/log-entry.sh — prepend a run entry to RUN-LOG.md, FIFO cap 10.
# Usage:
#   echo "<material result block>" | log-entry.sh
# Or:
#   log-entry.sh < entry-body.txt
#
# Env:
#   MAX_ENTRIES   default 10
#   RUNNER_SHA    default: short HEAD of automation/'s parent repo

set -u

DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$DIR/RUN-LOG.md"
LOCK="$DIR/.run-log.lock"
MAX_ENTRIES="${MAX_ENTRIES:-10}"
TS=$(date -u +%FT%TZ)
RUNNER_SHA="${RUNNER_SHA:-$(git -C "$DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)}"

# Read entry body from stdin BEFORE the python heredoc — the heredoc would
# otherwise consume stdin and the body would be lost.
BODY=$(cat)

if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK"
  flock -w 30 9 || { echo "ERROR: could not acquire lock $LOCK within 30s" >&2; exit 1; }
fi

LOG="$LOG" MAX_ENTRIES="$MAX_ENTRIES" TS="$TS" RUNNER_SHA="$RUNNER_SHA" BODY="$BODY" \
python3 - <<'PY'
import os, re

log_path    = os.environ["LOG"]
max_entries = int(os.environ["MAX_ENTRIES"])
ts          = os.environ["TS"]
runner_sha  = os.environ["RUNNER_SHA"]
body        = os.environ["BODY"].rstrip()

new_entry = f"<!-- ENTRY START: {ts} runner-{runner_sha} -->\n{body}\n<!-- ENTRY END -->"

header_default = (
    "<!-- AUTOMATED: cron runner artifact. Do not hand-edit. -->\n"
    "<!-- ENTRIES: keep last 10. FIFO eviction (drop oldest). -->\n"
    "<!-- Schema: ENTRY START / ENTRY END markers wrap each block. -->\n"
    "<!-- See: automation/policy.md, automation/scripts/log-entry.sh -->\n"
)

if os.path.exists(log_path):
    text = open(log_path).read()
    m = re.search(r'<!-- ENTRY START:', text)
    if m:
        header  = text[:m.start()]
        rest    = text[m.start():]
        entries = re.findall(r'<!-- ENTRY START:.*?<!-- ENTRY END -->', rest, flags=re.DOTALL)
    else:
        header  = text
        entries = []
else:
    header  = header_default
    entries = []

entries.insert(0, new_entry)
entries = entries[:max_entries]

with open(log_path, "w") as f:
    f.write(header.rstrip() + "\n\n")
    f.write("\n\n".join(entries))
    f.write("\n")

print(f"logged: {ts} runner-{runner_sha} -> {log_path}")
PY
