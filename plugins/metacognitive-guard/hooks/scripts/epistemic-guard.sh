#!/usr/bin/env bash
# =============================================================================
# EPISTEMIC GUARD - Blocks Wrong Beliefs Before They're Written
# =============================================================================
# Trigger: PreToolUse (Write, Edit)
# Purpose: The model cannot know what it doesn't know. This hook DOES.
#
# Scans tool input for danger patterns and BLOCKS with authoritative correction.
# =============================================================================

set -euo pipefail

# Plugin root provided by Claude Code
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-}"
[[ -z "$PLUGIN_ROOT" ]] && exit 0

# Read tool input from stdin (Claude Code passes JSON)
INPUT=$(cat 2>/dev/null || true)
[[ -z "$INPUT" ]] && exit 0

# Extract content being written/edited
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null || true)
[[ -z "$CONTENT" ]] && exit 0

# =============================================================================
# DANGER PATTERN DETECTION
# =============================================================================

# .NET 10 preview hallucination
if echo "$CONTENT" | grep -qiE "\.NET 10.*(preview|not.*(released|LTS|available))|\.NET 10 is still|net9\.0"; then
    cat << 'EOF'
{
  "decision": "block",
  "reason": "EPISTEMIC GUARD: Incorrect .NET version claim",
  "message": "FACT CHECK: .NET 10 is LTS (Long Term Support) since November 12, 2025.\n\nIt is NOT preview. Use net10.0 in TargetFramework.\n\nSource: https://dotnet.microsoft.com/download/dotnet/10.0\n\nPlease correct your response before writing."
}
EOF
    exit 0
fi

# DateTime.Now/UtcNow (banned API)
if echo "$CONTENT" | grep -qE 'DateTime\.(Now|UtcNow)|DateTimeOffset\.(Now|UtcNow)'; then
    cat << 'EOF'
{
  "decision": "block",
  "reason": "EPISTEMIC GUARD: Banned API - DateTime.Now",
  "message": "DateTime.Now/UtcNow should be avoided.\n\nUse: TimeProvider.System.GetUtcNow()\n\nThis enables testability and follows .NET 8+ best practices."
}
EOF
    exit 0
fi

# object lock (banned pattern)
if echo "$CONTENT" | grep -qE 'object\s+_?lock\s*='; then
    cat << 'EOF'
{
  "decision": "block",
  "reason": "EPISTEMIC GUARD: Banned pattern - object lock",
  "message": "object-based locking should be avoided.\n\nUse: Lock _lock = new();\n\n.NET 9+ Lock type is more efficient and type-safe."
}
EOF
    exit 0
fi

# Newtonsoft.Json (banned dependency)
if echo "$CONTENT" | grep -qE 'Newtonsoft\.Json|JsonConvert\.'; then
    cat << 'EOF'
{
  "decision": "block",
  "reason": "EPISTEMIC GUARD: Banned dependency - Newtonsoft.Json",
  "message": "Newtonsoft.Json should be avoided in new code.\n\nUse: System.Text.Json with source generators.\n\nExample: JsonSerializer.Serialize(obj, MyContext.Default.MyType)"
}
EOF
    exit 0
fi

# No violations found - allow
exit 0
