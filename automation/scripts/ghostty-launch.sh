#!/usr/bin/env bash
# automation/scripts/ghostty-launch.sh — launch 8 automation slots in tmux.
# Each pane runs one template against the configured repo via $AGENT_CMD.
# User attaches the resulting tmux session inside Ghostty (or any terminal).
#
# Usage:  ./ghostty-launch.sh
#
# Env:
#   AGENT_CMD  default: "claude --print --dangerously-skip-permissions"
#   SESSION    default: automations-<UTC-stamp>
#   REPO       default: current directory (the cwd panes start in)
#   DRY_RUN=1  print actions without executing tmux

set -u

DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENT_CMD="${AGENT_CMD:-claude --print --dangerously-skip-permissions}"
SESSION="${SESSION:-automations-$(date -u +%Y%m%d-%H%M)}"
REPO="${REPO:-$PWD}"
TEMPLATES_DIR="$DIR/templates"
DRY_RUN="${DRY_RUN:-0}"

[ -d "$TEMPLATES_DIR" ] || { echo "ERROR: templates dir missing: $TEMPLATES_DIR" >&2; exit 1; }
[ -d "/Applications/Ghostty.app" ] || echo "WARN: Ghostty.app not at /Applications — manual attach still works." >&2
command -v tmux >/dev/null || { echo "ERROR: tmux not in PATH" >&2; exit 1; }
[ -d "$REPO" ] || { echo "ERROR: REPO not found: $REPO" >&2; exit 1; }

# Discover templates (sorted)
TEMPLATES=()
while IFS= read -r f; do TEMPLATES+=("$f"); done < <(ls "$TEMPLATES_DIR"/*.md 2>/dev/null | sort)
[ "${#TEMPLATES[@]}" -ge 1 ] || { echo "ERROR: no templates in $TEMPLATES_DIR" >&2; exit 1; }
echo "found ${#TEMPLATES[@]} templates"

run() { if [ "$DRY_RUN" = "1" ]; then echo "DRY: $*"; else "$@"; fi; }

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "session $SESSION already exists; attach with: tmux attach -t $SESSION"
  exit 0
fi

run tmux new-session -d -s "$SESSION" -n bench -c "$REPO"

# Pane 0
T="${TEMPLATES[0]}"
SLOT=$(basename "$T" .md)
run tmux send-keys -t "$SESSION:bench.0" "echo '=== $SLOT ===' && $AGENT_CMD < '$T'" C-m

# Remaining panes
for ((i = 1; i < ${#TEMPLATES[@]}; i++)); do
  T="${TEMPLATES[$i]}"
  SLOT=$(basename "$T" .md)
  run tmux split-window -t "$SESSION:bench" -c "$REPO"
  run tmux select-layout -t "$SESSION:bench" tiled
  run tmux send-keys -t "$SESSION:bench.${i}" "echo '=== $SLOT ===' && $AGENT_CMD < '$T'" C-m
done

run tmux select-layout -t "$SESSION:bench" tiled

cat <<EOF

session ready: $SESSION

1. Open Ghostty (Cmd+Space → 'Ghostty', or:  open -a Ghostty).
2. Attach the session:    tmux attach -t $SESSION
3. (Other terminal) measure:
     HOST=ghostty PATTERN='claude|codex' \\
       $DIR/scripts/bench.sh ${#TEMPLATES[@]} $DIR/scripts/out/ghostty-n${#TEMPLATES[@]}.csv
4. Tear down when done:    tmux kill-session -t $SESSION
EOF
