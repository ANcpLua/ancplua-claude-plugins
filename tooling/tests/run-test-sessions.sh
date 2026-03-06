#!/usr/bin/env bash
set -euo pipefail

# Plugin Adversarial Test Runner
# Spawns parallel interactive Claude sessions in worktrees via tmux/iTerm2.
#
# Usage:  ./tooling/tests/run-test-sessions.sh [1 2 3]
#         ./tooling/tests/run-test-sessions.sh --cleanup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MODEL="${CLAUDE_TEST_MODEL:-opus}"

# session-num|worktree-name|prompt-file
SESSIONS=(
    "1|test-design-studio|session-1-design-studio.txt"
    "2|test-qyl-instrumentation|session-2-qyl-instrumentation.txt"
    "3|test-cross-plugin|session-3-cross-plugin.txt"
)

if [[ "${1:-}" == "--cleanup" ]]; then
    for entry in "${SESSIONS[@]}"; do
        IFS='|' read -r _ wt _ <<< "$entry"
        git -C "$REPO_ROOT" worktree remove "$wt" --force 2>/dev/null && echo "Removed $wt" || true
    done
    exit 0
fi

# Select sessions (all if no args)
selected=()
if [[ $# -eq 0 ]]; then
    selected=("${SESSIONS[@]}")
else
    for arg in "$@"; do
        for entry in "${SESSIONS[@]}"; do
            IFS='|' read -r num _ _ <<< "$entry"
            [[ "$num" == "$arg" ]] && selected+=("$entry")
        done
    done
fi

mkdir -p "$SCRIPT_DIR/results"

echo "Spawning ${#selected[@]} test sessions (model: $MODEL)"
echo ""

for entry in "${selected[@]}"; do
    IFS='|' read -r num wt prompt_file <<< "$entry"
    prompt="$(cat "$SCRIPT_DIR/prompts/$prompt_file")"
    echo "[$num] $wt"
    (cd "$REPO_ROOT" && claude -w "$wt" --tmux --model "$MODEL" "$prompt") &
    sleep 2
done

echo ""
echo "All sessions spawned. Observe in tmux panes."
echo "When done: $0 --cleanup"