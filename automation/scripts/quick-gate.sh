#!/usr/bin/env bash
# automation/scripts/quick-gate.sh — fast yes/no probe per repo.
# Usage: quick-gate.sh <repo-path>
# Prints a single line:  NO_WORK=1 ...   (clean)
#                or:     NO_WORK=0 ...   (work exists)
# Exits 0 on clean, 10 on work-exists. Any other exit means the helper itself failed.

set -u

REPO="${1:?usage: quick-gate.sh <repo-path>}"
[ -d "$REPO/.git" ] || { echo "ERROR: not a git repo: $REPO" >&2; exit 2; }

cd "$REPO" || exit 2

# Cheap signals only — no fetch, no gh round-trip beyond auth+open-PR count.
DIRTY=$(git status --porcelain | head -n1)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
DEFAULT=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')
DEFAULT="${DEFAULT:-main}"
LOCAL_NONDEFAULT=$(git for-each-ref --format='%(refname:short)' refs/heads | grep -v "^${DEFAULT}\$" | head -n1 || true)

OPEN_PRS="?"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  OPEN_PRS=$(gh pr list --state open --limit 1 --json number --jq 'length' 2>/dev/null || echo "?")
fi

WORK=0
[ -n "$DIRTY" ] && WORK=1
[ "$BRANCH" != "$DEFAULT" ] && WORK=1
[ -n "$LOCAL_NONDEFAULT" ] && WORK=1
case "$OPEN_PRS" in 0|"?") :;; *) WORK=1;; esac

DIRTY_FLAG=$([ -n "$DIRTY" ] && echo yes || echo no)
NONDEF_FLAG=$([ -n "$LOCAL_NONDEFAULT" ] && echo yes || echo no)

if [ "$WORK" -eq 0 ]; then
  echo "NO_WORK=1 repo=$REPO branch=$BRANCH default=$DEFAULT dirty=no nondefault=no open_prs=${OPEN_PRS}"
  exit 0
fi

echo "NO_WORK=0 repo=$REPO branch=$BRANCH default=$DEFAULT dirty=$DIRTY_FLAG nondefault=$NONDEF_FLAG open_prs=${OPEN_PRS}"
exit 10
