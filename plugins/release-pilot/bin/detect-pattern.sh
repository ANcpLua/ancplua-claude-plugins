#!/usr/bin/env bash
set -euo pipefail

# detect-pattern.sh — read .github/workflows/nuget-publish.yml in CWD,
# echo one of:
#   auto-bump      — Pattern A: push to main publishes (no manual gate).
#                    NET.Sdk. Deploy job has `if: github.ref == 'refs/heads/main'`.
#   tag-with-gate  — Pattern B: tag triggers publish, environment requires
#                    manual approval. Roslyn.Utilities, Agents.
#                    Workflow has `environment: nuget` on the publish job.
#   tag-direct     — Pattern C: tag triggers publish, no environment gate.
#                    Analyzers. Trigger is `tags: ['v*']` only; non-tag CI
#                    happens in a separate ci.yml workflow.
# Exit 1 with stderr message if no pattern matches.

WF="${1:-.github/workflows/nuget-publish.yml}"

if [ ! -f "$WF" ]; then
  echo "ERROR: workflow not found: $WF" >&2
  exit 1
fi

# Pattern A: deploy job gated by main branch ref.
if grep -qE "if:[[:space:]]*github\.ref[[:space:]]*==[[:space:]]*'refs/heads/main'" "$WF"; then
  echo "auto-bump"
  exit 0
fi

# Pattern B: publish job uses GitHub `nuget` environment for manual approval.
# The is_release-output gate is also a B signal, but environment: nuget is
# the load-bearing one for release-pilot's flow.
if grep -qE "^[[:space:]]*environment:[[:space:]]*nuget[[:space:]]*$" "$WF"; then
  echo "tag-with-gate"
  exit 0
fi

# Pattern C: tag-only trigger, no environment, no main-ref gate.
# Detect by: workflow has `tags: ['v*']` AND does NOT have a main-branch
# push trigger.
HAS_TAG_TRIGGER=0
if grep -qE "['\"]v\*['\"]" "$WF"; then
  HAS_TAG_TRIGGER=1
fi

HAS_MAIN_TRIGGER=0
# Look for `branches: [main]` (inline) or a `branches:` block followed by `- main`.
if grep -qE "branches:[[:space:]]*\[[[:space:]]*['\"]?main['\"]?[[:space:]]*\]" "$WF"; then
  HAS_MAIN_TRIGGER=1
elif awk '/^[[:space:]]*branches:[[:space:]]*$/{flag=1; next} flag && /^[[:space:]]*-[[:space:]]*['"'"'"]?main['"'"'"]?[[:space:]]*$/{found=1; exit} flag && /^[[:space:]]*[a-zA-Z_]+:/{flag=0} END{exit !found}' "$WF"; then
  HAS_MAIN_TRIGGER=1
fi

if [ "$HAS_TAG_TRIGGER" -eq 1 ] && [ "$HAS_MAIN_TRIGGER" -eq 0 ]; then
  echo "tag-direct"
  exit 0
fi

echo "ERROR: unrecognized release pattern in $WF — read it manually" >&2
exit 1
