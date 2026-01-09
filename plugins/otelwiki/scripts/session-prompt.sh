#!/usr/bin/env bash
# =============================================================================
# SESSION PROMPT - Outputs freshness check prompt at SessionStart
# =============================================================================
# Workaround for Claude Code v2.1.2 bug where prompt hooks require ToolUseContext
# =============================================================================

set -euo pipefail

cat << 'EOF'
OTel docs plugin loaded. Follow this flow:

1. IF user mentions 'search/web/latest/update' -> auto-proceed with checks (don't ask)

2. OTHERWISE ask: 'Sync OTel docs? (yes/no)'

**Freshness sources:**
- Semconv: WebFetch 'https://api.github.com/repos/open-telemetry/semantic-conventions/releases/latest'
- .NET SDK: WebFetch 'https://api.nuget.org/v3-flatcontainer/opentelemetry/index.json'
- Read ${CLAUDE_PLUGIN_ROOT}/docs/VERSION.md -> local version
- Compare -> report delta

**On YES:** run /otelwiki:sync, then show what changed
**On NO:** 'Check for patches?' -> YES = fetch latest release notes, NO = proceed

Keep it quick - user is waiting.
EOF
