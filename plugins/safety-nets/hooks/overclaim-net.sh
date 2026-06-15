#!/bin/bash
# overclaim-net — Stop hook.
# Fires once per turn. If the final assistant message asserts a RESULT-claim
# (done/fertig/ready/fixed/works/passing/complete/verified/launch-ready …)
# but NO evidence-producing tool ran this turn to back it, it blocks once and
# asks to either show the verification output or downgrade the wording.
# "Evidence-producing" = Bash/BashOutput, a subagent (Task/Agent), a Workflow,
# or any MCP tool (mcp__*) — something that ran or observed behavior, not a
# static read or an unverified edit. Deliberately omits ambiguous words like
# "test/testen".
#
# Turn boundary = from the last *genuine human* message to the end. Tool results
# are recorded as type:"user" rows too (they carry a toolUseResult payload), so
# they MUST be excluded — otherwise the window starts after the last command and
# the hook never sees the tool_use that backs the claim (constant false positive).
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

def is_human(r):
    # A genuine human turn-start: a user-type row that is NOT a tool result.
    # Tool results are also type:"user" and carry a toolUseResult payload /
    # a tool_result content block — exclude them, or the turn boundary lands
    # on the latest command output and hides the tool_use that backs a claim.
    if r.get("type") != "user":
        return False
    if r.get("toolUseResult") is not None:
        return False
    content = r.get("message", {}).get("content")
    if isinstance(content, list):
        if any(isinstance(c, dict) and c.get("type") == "tool_result" for c in content):
            return False
    return True

# turn = from the last genuine human message to the end
last_user = 0
for i, r in enumerate(rows):
    if is_human(r):
        last_user = i
turn = rows[last_user:]

# A tool whose use this turn counts as backing a result-claim: something that
# ran or observed behavior. Excludes static reads (Read/Grep/Glob) and
# unverified edits (Edit/Write) — making a change is not the same as proving it.
EVIDENCE = {"Bash", "BashOutput", "Task", "Agent", "Workflow"}
def is_evidence(name):
    return name in EVIDENCE or (isinstance(name, str) and name.startswith("mcp__"))

verified = False
last_text = ""
for r in turn:
    if r.get("type") == "assistant":
        for c in (r.get("message", {}).get("content") or []):
            if isinstance(c, dict):
                if c.get("type") == "text":
                    last_text = c.get("text", "")
                if c.get("type") == "tool_use" and is_evidence(c.get("name")):
                    verified = True
CLAIM = r"\b(done|fertig|erledigt|ready|bereit|fixed|behoben|gefixt|works|funktioniert|passing|complete|launch[- ]?ready|verified|verifiziert|guaranteed|garantiert)\b"
m = re.search(CLAIM, last_text, re.I)
if m and not verified:
    print(json.dumps({
        "decision": "block",
        "reason": ("overclaim-net: deine Nachricht behauptet \"%s\", aber diese Runde lief kein "
                   "Command/Tool (Bash, Subagent, Workflow, MCP), der das belegt. Entweder die "
                   "Verifikations-Ausgabe zeigen, oder runterstufen auf \"gemacht, aber nicht "
                   "verifiziert\". (Feuert nur einmal.)") % m.group()
    }))
PY
