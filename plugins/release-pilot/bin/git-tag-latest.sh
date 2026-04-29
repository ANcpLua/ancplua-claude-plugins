#!/usr/bin/env bash
set -euo pipefail

# git-tag-latest.sh — echo the highest semver vX.Y.Z tag on origin.
# Empty output if no tags exist. Strips annotated-tag `^{}` suffix.

git ls-remote --tags origin 'v*' \
  | awk '{print $2}' \
  | sed -e 's@^refs/tags/@@' -e 's@\^{}$@@' \
  | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
  | sort -V \
  | tail -1
