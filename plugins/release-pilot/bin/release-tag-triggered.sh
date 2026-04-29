#!/usr/bin/env bash
set -euo pipefail

# release-tag-triggered.sh <X.Y.Z> — Pattern B (Analyzers / Roslyn.Utilities /
# Agents): tag HEAD with vX.Y.Z and push the tag. Refuses to retag (ghost-tag
# rule). Echoes the triggered nuget-publish.yml run ID.
#
# Stdout: RUN_ID
# Stderr: progress notes
# Exit non-zero on precondition or retag attempt.

VERSION="${1:?usage: release-tag-triggered.sh <X.Y.Z>}"
TAG="v$VERSION"

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree not clean." >&2
  exit 1
fi

CUR_BRANCH=$(git branch --show-current)
if [ "$CUR_BRANCH" != "main" ]; then
  echo "ERROR: not on main (current: $CUR_BRANCH)" >&2
  exit 1
fi

# Refuse to overwrite an existing tag — that's how ghost tags become real
# damage. Always bump to next patch instead.
if git ls-remote --tags origin "$TAG" | grep -q "refs/tags/$TAG"; then
  echo "ERROR: $TAG already exists on remote. Bump to next patch — never retag." >&2
  exit 1
fi
if git tag -l | grep -qx "$TAG"; then
  echo "ERROR: $TAG exists locally. Delete with 'git tag -d $TAG' or bump." >&2
  exit 1
fi

git tag "$TAG" >&2
git push origin "$TAG" >&2

SHA=$(git rev-parse HEAD)
echo "Pushed $TAG ($SHA). Locating workflow run..." >&2

RUN_ID=""
for _ in 1 2 3 4 5 6 7; do
  RUN_ID=$(gh run list --workflow=nuget-publish.yml --limit=10 \
             --json databaseId,headSha,headBranch \
             -q ".[] | select(.headSha==\"$SHA\" and .headBranch==\"$TAG\") | .databaseId" \
             2>/dev/null | head -1)
  if [ -n "$RUN_ID" ]; then
    break
  fi
  sleep 3
done

if [ -z "$RUN_ID" ]; then
  echo "ERROR: could not locate nuget-publish.yml run for $TAG ($SHA) after 21s" >&2
  exit 1
fi

echo "$RUN_ID"
