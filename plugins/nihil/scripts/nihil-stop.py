#!/usr/bin/env python3
"""Stop hook: enforce Nihil output discipline once per mode cycle.

When the agent tries to stop, this checks the last assistant message against the
active mode and blocks once if the required structure is missing:

  review     findings present but missing Confidence or Evidence -> block, ask
             for the required finding format.
  implement  no Verification section -> block, ask for one.
  release    no Release Readiness / Blockers / Publishing Decision -> block.

Loop safety is belt-and-suspenders: it honors ``stop_hook_active`` when present
AND keeps a one-shot per-session flag, so it blocks at most once per mode cycle.
``nihil-mode.py`` clears that flag whenever a new ``/nihil:*`` command runs, which
re-arms the guard for the next cycle.

Anything it cannot read (no mode, unreadable transcript) fails open: the agent is
allowed to stop. The guard nudges format; it never traps a session.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import _nihil_state as st
except ImportError:  # helper missing: fail open so the agent can always stop
    sys.exit(0)


def block(reason, session_id):
    st.mark_stop_blocked(session_id)
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def extract_text(content):
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts = []
    for piece in content:
        if isinstance(piece, str):
            parts.append(piece)
        elif isinstance(piece, dict) and piece.get("type") == "text":
            parts.append(piece.get("text", ""))
    return "\n".join(parts)


def last_assistant_text(transcript_path):
    """Return the text of the most recent assistant message in the JSONL transcript."""
    if not transcript_path or not os.path.exists(transcript_path):
        return ""
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as fh:
            lines = fh.readlines()
    except OSError:
        return ""
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except ValueError:
            continue
        if not isinstance(obj, dict):
            continue
        message = obj.get("message") if isinstance(obj.get("message"), dict) else None
        role = obj.get("role") or (message or {}).get("role")
        if role != "assistant" and obj.get("type") != "assistant":
            continue
        content = (message or {}).get("content", obj.get("content"))
        text = extract_text(content)
        if text:
            return text
    return ""


FINDING_FORMAT = (
    "### N. Title\n"
    "- **Severity:** Critical / High / Medium / Low\n"
    "- **Confidence:** <percentage>\n"
    "- **Evidence:** <exact files, symbols, observed behavior>\n"
    "- **Problem:** <what is wrong>\n"
    "- **Impact:** <why it matters>\n"
    "- **Recommendation:** <concrete change>\n"
    "- **Do not change:** <out-of-scope / unproven nearby code>"
)


def review_block_reason(text):
    """Return a block reason if review output has malformed findings, else ``None``."""
    low = text.lower()
    has_findings = "## findings" in low or "severity:" in low
    if not has_findings:
        return None
    missing = [name for name, token in (("Confidence", "confidence:"), ("Evidence", "evidence:"))
               if token not in low]
    if not missing:
        return None
    return ("Nihil Review output has findings but is missing required field(s): "
            + ", ".join(missing) + ". Rewrite every finding in the required format:\n\n"
            + FINDING_FORMAT)


def main():
    data = st.load_stdin_json()
    if not data:
        sys.exit(0)

    session_id = data.get("session_id")
    mode = st.read_mode(session_id)
    if not mode:
        sys.exit(0)

    # loop guards: honor the runtime flag if present, and our own one-shot flag
    if data.get("stop_hook_active") is True or st.stop_already_blocked(session_id):
        sys.exit(0)

    text = last_assistant_text(data.get("transcript_path"))
    low = text.lower()

    if mode == "review":
        reason = review_block_reason(text)
        if reason:
            block(reason, session_id)
    elif mode == "implement":
        if "verification" not in low:
            block("Nihil Implementation output is missing a Verification section. Add a "
                  "'## Verification' section listing the checks you ran (build / tests / running the "
                  "artifact) and their results before stopping.", session_id)
    elif mode == "release":
        if not any(key in low for key in ("release readiness", "blocker", "publishing decision")):
            block("Nihil Release output is missing a release readiness / blockers section. Add "
                  "'## Release Readiness', '## Publishing Decision', and '## Blockers' before stopping.",
                  session_id)

    sys.exit(0)


main()
