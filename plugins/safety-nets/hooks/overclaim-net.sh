#!/bin/bash
# overclaim-net — Stop hook.
# Fires once per turn. If the final assistant message asserts a RESULT-claim
# (done/fertig/ready/fixed/works/passing/complete/verified/launch-ready …)
# but NO command ran this turn to back it, it blocks once and asks to either
# show the verification output or downgrade the wording.
# Deliberately omits ambiguous words like "test/testen".
input=$(cat)
py() { printf '%s' "$input" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('$1',''))" 2>/dev/null; }
stop_active=$(py stop_hook_active)
transcript=$(py transcript_path)
# nudge at most once per turn (a prior block sets stop_hook_active=true)
[ "$stop_active" = "True" ] && exit 0
[ -f "$transcript" ] || exit 0

python3 - "$transcript" <<'PY'
import sys, json, re
rows = []
for line in open(sys.argv[1]):
    line = line.strip()
    if line:
        try: rows.append(json.loads(line))
        except Exception: pass
# turn = from the last user message to the end
last_user = 0
for i, r in enumerate(rows):
    if r.get("type") == "user":
        last_user = i
turn = rows[last_user:]
verified = False
last_text = ""
for r in turn:
    if r.get("type") == "assistant":
        for c in (r.get("message", {}).get("content") or []):
            if isinstance(c, dict):
                if c.get("type") == "text":
                    last_text = c.get("text", "")
                if c.get("type") == "tool_use" and c.get("name") == "Bash":
                    verified = True
CLAIM = r"\b(done|fertig|erledigt|ready|bereit|fixed|behoben|gefixt|works|funktioniert|passing|complete|launch[- ]?ready|verified|verifiziert|guaranteed|garantiert)\b"
m = re.search(CLAIM, last_text, re.I)
if m and not verified:
    print(json.dumps({
        "decision": "block",
        "reason": ("overclaim-net: deine Nachricht behauptet \"%s\", aber diese Runde lief kein "
                   "Command, der das belegt. Entweder die Verifikations-Ausgabe zeigen, oder "
                   "runterstufen auf \"gemacht, aber nicht verifiziert\". (Feuert nur einmal.)") % m.group()
    }))
PY
