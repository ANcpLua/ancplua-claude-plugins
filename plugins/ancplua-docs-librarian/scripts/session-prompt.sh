#!/usr/bin/env bash
# =============================================================================
# SESSION PROMPT - Outputs freshness check prompt at SessionStart
# =============================================================================
# Workaround for Claude Code v2.1.2 bug where prompt hooks require ToolUseContext
# =============================================================================

set -euo pipefail

cat << 'EOF'
ANcpLua Docs Librarian loaded.

**Auto-freshness** (if user says search/latest/update/versions) OR ask 'Quick version check? (yes/no)':

**NuGet API is source of truth:**
1. WebFetch 'https://api.nuget.org/v3-flatcontainer/ancplua.net.sdk/index.json' → latest SDK version
2. WebFetch 'https://api.nuget.org/v3-flatcontainer/microsoft.codeanalysis.csharp/index.json' → latest Roslyn
3. Read local Version.props in each repo → current versions
4. Compare → report delta

**Key packages:**
- ancplua.net.sdk
- ancplua.analyzers
- microsoft.codeanalysis.csharp
- xunit.v3 + xunit.v3.mtp-v2 (must match, exe output required)

**If mismatch:** 'Local uses X.Y, NuGet has A.B - verifying patterns still apply'

Keep it quick - user is waiting.
EOF
