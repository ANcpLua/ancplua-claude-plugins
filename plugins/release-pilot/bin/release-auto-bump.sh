#!/usr/bin/env bash
set -euo pipefail

# release-auto-bump.sh — Pattern A (NET.Sdk): push to main, then echo the
# nuget-publish.yml run ID for that commit. The workflow's compute_version
# job picks the version; we don't pass one.
#
# Stdout: RUN_ID (single integer)
# Stderr: progress notes
# Exit non-zero on precondition failure.

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree not clean. Commit or stash first." >&2
  exit 1
fi

CUR_BRANCH=$(git branch --show-current)
if [ "$CUR_BRANCH" != "main" ]; then
  echo "ERROR: not on main (current: $CUR_BRANCH)" >&2
  exit 1
fi

# Standing-authority repos under /Users/ancplua/framework/ have push to main
# pre-authorized; this script assumes that context.
git push origin main >&2

SHA=$(git rev-parse HEAD)
echo "Pushed $SHA → main. Locating workflow run..." >&2

RUN_ID=""
for _ in 1 2 3 4 5 6 7; do
  RUN_ID=$(gh run list --workflow=nuget-publish.yml --limit=10 \
             --json databaseId,headSha \
             -q ".[] | select(.headSha==\"$SHA\") | .databaseId" \
             2>/dev/null | head -1)
  if [ -n "$RUN_ID" ]; then
    break
  fi
  sleep 3
done

if [ -z "$RUN_ID" ]; then
  echo "ERROR: could not locate nuget-publish.yml run for $SHA after 21s" >&2
  exit 1
fi

echo "$RUN_ID"
