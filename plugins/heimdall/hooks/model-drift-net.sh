#!/usr/bin/env bash
# model-drift-net — Stop hook. PASSIVE, never blocks.
#
# Fires at the end of a turn. Reads the session transcript and compares the
# two most recent DISTINCT served models (message.model). If the model that
# served this turn differs from the one before it, it surfaces a one-line
# notice — so a silent Opus↔Fable fallback swap becomes a visible event
# instead of something you only notice when a limit banner appears.
#
# It NEVER blocks the stop and never nags on a steady model: output is emitted
# only on an actual change. No LLM, no network.
input=$(cat)
transcript=$(printf '%s' "$input" | python3 -c "import sys,json;print(json.load(sys.stdin).get('transcript_path',''))" 2>/dev/null)
[ -n "$transcript" ] && [ -f "$transcript" ] || exit 0

python3 - "$transcript" <<'PY'
import sys, json
models = []
for line in open(sys.argv[1]):
    try: d = json.loads(line)
    except Exception: continue
    if d.get("type") != "assistant": continue
    m = d.get("message", {})
    if not isinstance(m, dict): continue
    mod = m.get("model")
    if not mod or mod == "<synthetic>": continue
    if not models or models[-1] != mod:   # collapse consecutive repeats
        models.append(mod)

# need at least two distinct model states, and the change must be the latest one
if len(models) >= 2 and models[-1] != models[-2]:
    prev, cur = models[-2], models[-1]
    msg = f"heimdall · model-drift: served model changed {prev} → {cur} this turn (fallback swap). Run /heimdall for the full ledger; /model to pin."
    # advisory, non-blocking
    print(json.dumps({"systemMessage": msg}))
PY
exit 0
