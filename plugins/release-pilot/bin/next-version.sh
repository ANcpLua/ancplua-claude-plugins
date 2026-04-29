#!/usr/bin/env bash
set -euo pipefail

# next-version.sh <PackageId> [<PackageId>...] — compute the next release
# version as max(latest-remote-tag, max-over-package-IDs latest-nuget) + patch+1.
#
# Stdout: NEXT_VERSION (no v prefix), e.g. 1.2.4
# Stderr: diagnostic notes
# Exit codes:
#   0 — normal
#   1 — bad input or no version data anywhere
#   2 — out-of-band publish detected (nuget > git-tag); halt, do not auto-bump

if [ "$#" -lt 1 ]; then
  echo "usage: next-version.sh <PackageId> [<PackageId>...]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

LATEST_TAG_V=$("$SCRIPT_DIR/git-tag-latest.sh" || true)
LATEST_TAG=${LATEST_TAG_V#v}

LATEST_NUGET=""
for pkg in "$@"; do
  v=$("$SCRIPT_DIR/nuget-latest.sh" "$pkg" || true)
  if [ -n "$v" ]; then
    if [ -z "$LATEST_NUGET" ] \
       || [ "$(printf '%s\n%s\n' "$v" "$LATEST_NUGET" | sort -V | tail -1)" = "$v" ]; then
      LATEST_NUGET="$v"
    fi
  fi
done

if [ -z "$LATEST_TAG" ] && [ -z "$LATEST_NUGET" ]; then
  echo "ERROR: no semver tags and no published nuget versions; specify initial version manually" >&2
  exit 1
fi

# Asymmetry checks.
if [ -n "$LATEST_TAG" ] && [ -n "$LATEST_NUGET" ] && [ "$LATEST_TAG" != "$LATEST_NUGET" ]; then
  HIGHER=$(printf '%s\n%s\n' "$LATEST_TAG" "$LATEST_NUGET" | sort -V | tail -1)
  if [ "$HIGHER" = "$LATEST_NUGET" ]; then
    echo "WARNING: nuget=$LATEST_NUGET ahead of tag=v$LATEST_TAG — out-of-band publish; investigate before continuing" >&2
    exit 2
  else
    echo "ghost-tag detected: tag=v$LATEST_TAG nuget=$LATEST_NUGET — bumping past" >&2
  fi
fi

MAX=$(printf '%s\n%s\n' "${LATEST_TAG:-0.0.0}" "${LATEST_NUGET:-0.0.0}" | sort -V | tail -1)
IFS='.' read -r MA MI PA <<< "$MAX"
echo "${MA}.${MI}.$((PA + 1))"
