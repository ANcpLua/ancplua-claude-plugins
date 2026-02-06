#!/usr/bin/env bash
# =============================================================================
# TRUTH BEACON - Injects Authoritative Facts at Session Start
# =============================================================================
# Trigger: SessionStart
# Purpose: Prime the model with ground truth BEFORE it can form wrong beliefs
#
# This is proactive injection, not reactive correction.
# The model receives authoritative facts before it generates anything.
# =============================================================================

set -euo pipefail

# Plugin root provided by Claude Code
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

# Check for user-level override first, then plugin default
USER_ASSERTIONS="${HOME}/.claude/assertions.yaml"
PLUGIN_ASSERTIONS="$PLUGIN_ROOT/blackboard/assertions.yaml"

if [[ -f "$USER_ASSERTIONS" ]]; then
    ASSERTIONS="$USER_ASSERTIONS"
elif [[ -f "$PLUGIN_ASSERTIONS" ]]; then
    ASSERTIONS="$PLUGIN_ASSERTIONS"
else
    exit 0
fi

# =============================================================================
# EXTRACT KEY FACTS FROM ASSERTIONS
# =============================================================================

# Parse .NET version info (using grep/sed for portability, no yq dependency)
DOTNET_VERSION=$(grep -A5 "dotnet:" "$ASSERTIONS" | grep "value:" | head -1 | sed 's/.*value: *"\([^"]*\)".*/\1/' || echo "10.0")
DOTNET_STATUS=$(grep -A5 "dotnet:" "$ASSERTIONS" | grep "status:" | head -1 | sed 's/.*status: *"\([^"]*\)".*/\1/' || echo "LTS")
DOTNET_DATE=$(grep -A5 "dotnet:" "$ASSERTIONS" | grep "release_date:" | head -1 | sed 's/.*release_date: *"\([^"]*\)".*/\1/' || echo "2025-11-11")

CSHARP_VERSION=$(grep -A2 "csharp:" "$ASSERTIONS" | grep "value:" | head -1 | sed 's/.*value: *"\([^"]*\)".*/\1/' || echo "14.0")

# =============================================================================
# INJECT AUTHORITATIVE FACTS (the "beacon")
# =============================================================================

cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<ground-truth source=\\"metacognitive-guard\\">

AUTHORITATIVE FACTS (override training priors):

RUNTIME:
- .NET ${DOTNET_VERSION} is ${DOTNET_STATUS} (since ${DOTNET_DATE}) - NOT preview
- C# ${CSHARP_VERSION} is current
- Use net${DOTNET_VERSION} in TargetFramework

BANNED APIS:
- DateTime.Now/UtcNow -> use TimeProvider.System.GetUtcNow()
- object _lock -> use Lock _lock = new()
- Newtonsoft.Json -> use System.Text.Json

CLAUDE CODE CONVENTIONS:
- AGENTS.md is NOT auto-loaded by plugins (dead weight - use skill descriptions)
- hooks/hooks.json auto-loads by convention (do NOT declare in plugin.json)
- Passive context = CLAUDE.md + skill description frontmatter + SessionStart hooks

If uncertain about versions/APIs:
- WebSearch to verify current state
- Do NOT rely on training priors for version info

</ground-truth>"
  }
}
EOF
