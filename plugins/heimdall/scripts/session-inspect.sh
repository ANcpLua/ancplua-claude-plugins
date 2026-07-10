#!/usr/bin/env bash
# session-inspect.sh — the extended read of a Claude Code session transcript.
#
# model-ledger.sh answers "which model?"; this answers "what else is the
# transcript telling me?" — the richer per-turn metadata the inference server
# stamps and Claude Code records but never surfaces in the UI:
#   • served model(s) + advisorModel (executor/advisor pattern)
#   • service_tier (standard / priority / batch — your cost lane)
#   • speed + inference_geo (fast mode; where inference actually ran)
#   • token totals incl. cache_read / cache_creation + cache HIT RATE
#   • cache-miss reasons with re-charged token counts (why cache got busted)
#   • stop_reason distribution, Claude Code version, entrypoint
#
# No secrets, no network, no LLM. Read-only.
set -euo pipefail

PROJ_ROOT="$HOME/.claude/projects"
# "|| true": under pipefail, head(1) exiting after one line SIGPIPEs ls once
# the listing exceeds the pipe buffer, killing the whole script (exit 141).
pick_transcript() {
  if [ "${1:-}" = "--all" ]; then ls -t "$PROJ_ROOT"/*/*.jsonl 2>/dev/null | head -1 || true; return; fi
  if [ -n "${1:-}" ] && [ -f "$1" ]; then printf '%s' "$1"; return; fi
  local mangled; mangled="$(printf '%s' "$PWD" | sed 's/[/.]/-/g')"
  local dir="$PROJ_ROOT/$mangled"
  if [ -d "$dir" ]; then ls -t "$dir"/*.jsonl 2>/dev/null | head -1 || true; return; fi
  ls -t "$PROJ_ROOT"/*/*.jsonl 2>/dev/null | head -1 || true
}

T="$(pick_transcript "${1:-}")"
[ -n "$T" ] && [ -f "$T" ] || { echo "heimdall: no transcript found (pass a path, or run --all)"; exit 1; }

echo "heimdall · session inspect"
echo "transcript: $T"
echo "============================================================"

python3 - "$T" <<'PY'
import sys, json
from collections import Counter, defaultdict

served=Counter(); advisor=Counter(); tier=Counter(); speed=Counter(); geo=Counter()
stops=Counter(); ver=Counter(); entry=Counter(); miss=Counter()
miss_tokens=defaultdict(int)
inp=out=cread=ccreate=0
per_model_out=defaultdict(int)
n=0; swaps=[]; prev=None

for line in open(sys.argv[1]):
    try: d=json.loads(line)
    except Exception: continue
    if d.get("type")!="assistant": continue
    m=d.get("message",{})
    if not isinstance(m,dict): continue
    mod=m.get("model")
    if not mod or mod=="<synthetic>": continue
    n+=1
    served[mod]+=1
    if prev is not None and mod!=prev: swaps.append((d.get("timestamp",""),prev,mod))
    prev=mod
    if d.get("advisorModel"): advisor[d["advisorModel"]]+=1
    ver[d.get("version","?")]+=1; entry[d.get("entrypoint","?")]+=1
    if m.get("stop_reason"): stops[m["stop_reason"]]+=1
    u=m.get("usage",{}) or {}
    if u.get("service_tier"): tier[u["service_tier"]]+=1
    if u.get("speed") is not None: speed[str(u["speed"])]+=1
    if u.get("inference_geo"): geo[u["inference_geo"]]+=1
    i=u.get("input_tokens",0); o=u.get("output_tokens",0)
    inp+=i; out+=o; per_model_out[mod]+=o
    cread+=u.get("cache_read_input_tokens",0); ccreate+=u.get("cache_creation_input_tokens",0)
    diag=m.get("diagnostics")
    if isinstance(diag,dict):
        cm=diag.get("cache_miss_reason")
        if isinstance(cm,dict) and cm.get("type"):
            miss[cm["type"]]+=1; miss_tokens[cm["type"]]+=cm.get("cache_missed_input_tokens",0)

if not n:
    print("No served-model rows yet — check back after a turn completes."); sys.exit(0)

def row(label,val): print(f"  {label:<22} {val}")
def dist(label,c):
    if c: print(f"  {label:<22} " + "  ".join(f"{k}×{v}" for k,v in c.most_common()))

print("IDENTITY")
row("assistant turns", n)
dist("served model", served)
if len(served)>1: row("→ current model", prev)
dist("advisorModel", advisor)
print()
print("ROUTING / TIER")
dist("service_tier", tier)
dist("speed", speed)
dist("inference_geo", geo)
dist("entrypoint", entry)
dist("cc version", ver)
print()
print("TOKENS")
row("input (fresh)", f"{inp:,}")
row("output", f"{out:,}")
row("cache_read", f"{cread:,}")
row("cache_creation", f"{ccreate:,}")
denom=cread+inp
if denom:
    row("cache hit rate", f"{cread/denom*100:.1f}%  (cache_read / (cache_read+fresh_input))")
if len(served)>1:
    print("  output tokens by model:")
    for mdl,o in sorted(per_model_out.items(), key=lambda x:-x[1]):
        print(f"      {mdl:<26} {o:,}")
print()
print("CACHE MISSES  (fresh input you were re-charged for, by reason)")
if miss:
    for reason,cnt in miss.most_common():
        print(f"  {reason:<26} {cnt:>4}×   {miss_tokens[reason]:>12,} tokens")
    print(f"  {'TOTAL re-charged':<26} {sum(miss.values()):>4}    {sum(miss_tokens.values()):>12,} tokens")
    print("  (tools_changed = your MCP/tool set changed mid-session; messages_changed")
    print("   = history was edited/compacted; both bust the prompt cache. Fewer mid-")
    print("   session tool/MCP toggles → higher cache hit → lower cost.)")
else:
    print("  none recorded — clean cache reuse.")
print()
print("STOP REASONS")
dist("stop_reason", stops)
if swaps:
    print()
    print(f"⚠ {len(swaps)} model swap(s):")
    for ts,a,b in swaps: print(f"    {ts}   {a} → {b}")
PY