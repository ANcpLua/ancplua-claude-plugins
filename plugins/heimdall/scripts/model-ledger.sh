#!/usr/bin/env bash
# model-ledger.sh — GROUND TRUTH for "which model served me?"
#
# Reads a Claude Code session transcript (.jsonl) and prints, per assistant
# turn, the model that ACTUALLY served it (message.model — stamped by the
# inference server, not the client). This is the only reliable answer to
# "am I on Opus or Fable?" — network timing and UI banners cannot tell you.
#
# It also flags every point where the served model CHANGED (a fallback swap),
# and prints per-model turn counts + token usage.
#
# Usage:
#   model-ledger.sh [transcript.jsonl]     explicit transcript
#   model-ledger.sh                        auto-detect newest transcript for $PWD's project
#   model-ledger.sh --all                  newest transcript anywhere under ~/.claude/projects
set -euo pipefail

PROJ_ROOT="$HOME/.claude/projects"

pick_transcript() {
  if [ "${1:-}" = "--all" ]; then
    ls -t "$PROJ_ROOT"/*/*.jsonl 2>/dev/null | head -1; return
  fi
  if [ -n "${1:-}" ] && [ -f "$1" ]; then printf '%s' "$1"; return; fi
  # Claude Code mangles the cwd into the project dir name: / and . -> -
  local mangled; mangled="$(printf '%s' "$PWD" | sed 's/[/.]/-/g')"
  local dir="$PROJ_ROOT/$mangled"
  if [ -d "$dir" ]; then ls -t "$dir"/*.jsonl 2>/dev/null | head -1; return; fi
  # fallback: newest transcript that actually contains a served model
  ls -t "$PROJ_ROOT"/*/*.jsonl 2>/dev/null | head -1
}

T="$(pick_transcript "${1:-}")"
[ -n "$T" ] && [ -f "$T" ] || { echo "heimdall: no transcript found (pass a path, or run --all)"; exit 1; }

echo "heimdall · model ledger"
echo "transcript: $T"
echo "------------------------------------------------------------"

python3 - "$T" <<'PY'
import sys, json
from collections import Counter, defaultdict

rows = []
for line in open(sys.argv[1]):
    try: d = json.loads(line)
    except Exception: continue
    if d.get("type") != "assistant": continue
    m = d.get("message", {})
    if not isinstance(m, dict): continue
    model = m.get("model")
    if not model or model == "<synthetic>": continue
    u = m.get("usage", {}) or {}
    rows.append({
        "ts": d.get("timestamp", ""),
        "model": model,
        "in": u.get("input_tokens", 0),
        "out": u.get("output_tokens", 0),
    })

if not rows:
    print("No served-model rows in this transcript yet.")
    print("(Turns stamp message.model once the assistant has replied — check again after a turn.)")
    sys.exit(0)

counts = Counter(r["model"] for r in rows)
toks = defaultdict(lambda: [0, 0])
for r in rows:
    toks[r["model"]][0] += r["in"]; toks[r["model"]][1] += r["out"]

# swap detection
swaps = []
prev = None
for r in rows:
    if prev is not None and r["model"] != prev:
        swaps.append((r["ts"], prev, r["model"]))
    prev = r["model"]

print(f"assistant turns with a served model : {len(rows)}")
print(f"distinct models served              : {len(counts)}")
print()
print("per-model breakdown:")
for model, n in counts.most_common():
    i, o = toks[model]
    print(f"  {model:<28} {n:>4} turns   in={i:>9}  out={o:>8}")
print()
print(f"CURRENT (latest served) model       : {rows[-1]['model']}   @ {rows[-1]['ts']}")
if swaps:
    print()
    print(f"⚠ {len(swaps)} model swap(s) detected this session:")
    for ts, a, b in swaps:
        print(f"    {ts}   {a}  →  {b}")
else:
    print("no mid-session model swaps — one model served the whole transcript.")
PY