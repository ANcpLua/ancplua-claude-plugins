#!/usr/bin/env bash
# automation/scripts/bench.sh — measure parallel agent runs per host.
# Run alongside the launch. One invocation per host (one CSV per host+N).
#
# Usage:
#   HOST=ghostty PATTERN='claude' ./bench.sh 8 out/ghostty-n8.csv
#
# Env:
#   HOST       label written into the CSV (e.g. ghostty, warp, terminal, iterm2, cursor, rider, webstorm, tmux)
#   PATTERN    regex matching agent processes (default: 'claude')
#   HOST_PID   pid of the host app for overhead measurement (default: pgrep -n -i $HOST)
#   INTERVAL   sample interval seconds (default 2)
#   TIMEOUT_S  hard cap seconds (default 7200 = 2h)

set -u

N="${1:?usage: bench.sh <N> <out.csv>}"
OUT="${2:?usage: bench.sh <N> <out.csv>}"
INTERVAL="${INTERVAL:-2}"
PATTERN="${PATTERN:-claude}"
HOST="${HOST:-unknown}"
HOST_PID="${HOST_PID:-$(pgrep -n -i "$HOST" 2>/dev/null || echo 0)}"
TIMEOUT_S="${TIMEOUT_S:-7200}"

mkdir -p "$(dirname "$OUT")"
echo "ts_iso,elapsed_s,n_agents,host,pid,role,cmd,cpu_pct,rss_mb" > "$OUT"
START=$(date -u +%s)

while :; do
  NOW_ISO=$(date -u +%FT%TZ)
  ELAPSED=$(( $(date -u +%s) - START ))

  # Agent processes
  ps -axo pid=,comm=,%cpu=,rss= \
    | awk -v p="$PATTERN" '$2 ~ p {printf "%s,%s,%s,%s\n", $1, $2, $3, $4}' \
    | while IFS=, read -r PID COMM CPU RSS; do
        echo "$NOW_ISO,$ELAPSED,$N,$HOST,$PID,agent,$COMM,$CPU,$((RSS/1024))" >> "$OUT"
      done

  # Host process for overhead comparison
  if [ "$HOST_PID" -gt 0 ]; then
    ps -p "$HOST_PID" -o pid=,comm=,%cpu=,rss= 2>/dev/null \
      | awk -v iso="$NOW_ISO" -v e="$ELAPSED" -v n="$N" -v h="$HOST" \
            '{printf "%s,%s,%s,%s,%s,host,%s,%s,%s\n", iso, e, n, h, $1, $2, $3, int($4/1024)}' \
            >> "$OUT"
  fi

  COUNT=$(pgrep -f -c "$PATTERN" 2>/dev/null || echo 0)
  [ "$COUNT" -eq 0 ] && [ "$ELAPSED" -gt 30 ] && break
  [ "$ELAPSED" -gt "$TIMEOUT_S" ] && { echo "timeout after ${TIMEOUT_S}s" >&2; break; }
  sleep "$INTERVAL"
done

echo "done: $OUT"
