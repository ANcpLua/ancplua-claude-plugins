#!/usr/bin/env bash
set -euo pipefail

# detect-pattern.sh — read .github/workflows/nuget-publish.yml in CWD,
# echo "auto-bump" (Pattern A — push-to-main publishes) or
# "tag-triggered" (Pattern B — only tag pushes publish).
# Exit 1 with stderr message if neither pattern matches.

WF="${1:-.github/workflows/nuget-publish.yml}"

if [ ! -f "$WF" ]; then
  echo "ERROR: workflow not found: $WF" >&2
  exit 1
fi

# Signal 1: deploy/publish job is gated by main branch
# (`if: github.ref == 'refs/heads/main'`) — Pattern A. ANcpLua.NET.Sdk.
GATED_BY_MAIN=0
if grep -qE "if:[[:space:]]*github\.ref[[:space:]]*==[[:space:]]*'refs/heads/main'" "$WF"; then
  GATED_BY_MAIN=1
fi

# Signal 2: publish job gated by an `is_release == 'true'` output —
# Pattern B with main-branch CI. ANcpLua.Roslyn.Utilities, ANcpLua.Agents.
GATED_BY_RELEASE=0
if grep -qE "if:.*is_release.*==.*'true'" "$WF"; then
  GATED_BY_RELEASE=1
fi

# Signal 3: workflow has any `v*` tag trigger — handles both YAML
# inline-flow (`tags: ['v*']`) and block (`tags:\n  - 'v*'`) forms.
# ANcpLua.Analyzers (pure tag), ANcpLua.Roslyn.Utilities/Agents (mixed).
HAS_TAG_TRIGGER=0
if grep -qE "['\"]v\*['\"]" "$WF"; then
  HAS_TAG_TRIGGER=1
fi

if [ "$GATED_BY_MAIN" -eq 1 ]; then
  echo "auto-bump"
  exit 0
fi

if [ "$GATED_BY_RELEASE" -eq 1 ] || [ "$HAS_TAG_TRIGGER" -eq 1 ]; then
  echo "tag-triggered"
  exit 0
fi

echo "ERROR: unrecognized release pattern in $WF — read it manually" >&2
exit 1
