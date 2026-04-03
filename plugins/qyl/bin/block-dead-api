#!/usr/bin/env python3
"""PreToolUse: blocks writes using dead/ghost qyl patterns in .cs/.csproj files."""
import json
import re
import sys

DEAD_PATTERNS: list[tuple[str, str]] = [
    # Ghost projects
    (r'\bqyl\.protocol\b', "qyl.protocol is dead — renamed to qyl.contracts"),
    (r'\bqyl\.servicedefaults\b', "qyl.servicedefaults is dead — renamed to qyl.instrumentation"),
    (r'\bqyl\.browser\b', "qyl.browser never existed"),
    (r'\bqyl\.copilot\b', "qyl.copilot never existed — use MapAGUI() for CopilotKit"),
    (r'\bqyl\.hosting\b', "qyl.hosting never existed — use Microsoft.Agents.AI.Hosting"),
    (r'\bqyl\.watchdog\b', "qyl.watchdog never existed"),
    (r'\bqyl\.cli\b', "qyl.cli never existed"),
    # Dead custom APIs
    (r'\bQylAgentBuilder\b', "QylAgentBuilder is dead — use AddAIAgent() or AsAIAgent() + AIAgentBuilder"),
    (r'\bMapQylAguiChat\b', "MapQylAguiChat is dead — use MapAGUI()"),
    (r'\bGenerateResponseAsync\b', "GenerateResponseAsync is dead — use RunAsync"),
    (r'\bGenerateStreamingResponseAsync\b', "GenerateStreamingResponseAsync is dead — use RunStreamingAsync"),
    # Wrong UI library
    (r'from\s+["\']@radix-ui/', "Radix UI is banned — use Base UI"),
    (r'from\s+["\']@shadcn/', "shadcn/ui is banned (uses Radix) — use Base UI"),
    (r'from\s+["\']phosphor-react', "Phosphor icons replaced by lucide-react"),
]

from pathlib import Path

# Only fire in qyl project directories
if not Path("qyl.slnx").exists() and "/qyl" not in str(Path.cwd()):
    sys.exit(0)

try:
    event = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(0)

tool_input = event.get("tool_input", {})
content = tool_input.get("content") or tool_input.get("new_string") or ""
if not content:
    sys.exit(0)

violations = []
for pattern, msg in DEAD_PATTERNS:
    if re.search(pattern, content):
        violations.append(msg)

if violations:
    err = "BLOCKED: Dead qyl patterns detected:\n" + "\n".join(f"  - {v}" for v in violations)
    print(err, file=sys.stderr)
    sys.exit(2)

sys.exit(0)
