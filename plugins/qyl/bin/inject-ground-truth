#!/usr/bin/env bash
# SessionStart: inject qyl ground truth as passive context.
# Only fires in qyl project directories.
set -euo pipefail

# Only inject if we're in a qyl project
[[ -f "qyl.slnx" ]] || [[ "$PWD" == *"/qyl"* ]] || exit 0

CONTEXT="<QYL_GROUND_TRUTH>
REAL PROJECTS (only these 8 exist): qyl.collector, qyl.contracts, qyl.instrumentation, qyl.instrumentation.generators, qyl.collector.storage.generators, qyl.loom, qyl.mcp, qyl.dashboard.
GHOST PROJECTS (do NOT reference): qyl.protocol, qyl.servicedefaults, qyl.servicedefaults.generator, qyl.browser, qyl.copilot, qyl.hosting, qyl.watch, qyl.watchdog, qyl.cli, qyl.agents, qyl.workflows.
MAF RC: Two patterns — standalone: chatClient.AsAIAgent(); hosted/DI (use for qyl.collector): builder.AddAIAgent() + IHostedAgentBuilder + WithInMemorySessionStore(). Both valid. Dead: QylAgentBuilder, MapQylAguiChat, GenerateResponseAsync, custom session stores.
UI: Base UI 1.3.0 (NEVER shadcn/ui or Radix UI). Icons: lucide-react (NOT Phosphor).
OTel: SDK 1.15.0, Semconv 1.40 (different version tracks). Built-in MAF observability via OpenTelemetryAgent + WithOpenTelemetry().
Loom: standalone Exe with CollectorClient (HTTP-only). NOT a class library, NOT direct DuckDB access.
DuckDB 1.5.0: glibc required (Debian, not Alpine). Single-writer. Collector owns storage.
</QYL_GROUND_TRUTH>"

if command -v jq &>/dev/null; then
  jq -n --arg ctx "$CONTEXT" \
    '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":$ctx}}'
else
  ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"$ESCAPED\"}}"
fi
