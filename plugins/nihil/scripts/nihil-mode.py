#!/usr/bin/env python3
"""UserPromptExpansion hook: detect a ``/nihil:*`` command and pin the session mode.

Fires when a typed slash command expands. Only ``nihil``-namespaced commands set
a mode — bare ``review`` / ``release`` (which other plugins also ship) are ignored
so this never hijacks another plugin's command. If the command is not a Nihil
command, the hook does nothing and the prompt expands normally.

On a match it persists the mode for the session, re-arms the Stop guard, and
injects a mode banner back to Claude via ``additionalContext``. Enforcement does
not depend on that banner — the PreToolUse and Stop hooks read the persisted mode
directly — so a dropped banner only loses the reminder, never the guardrail.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import _nihil_state as st
except ImportError:  # helper missing: fail open so prompt expansion is never blocked
    sys.exit(0)

BANNERS = {
    "review": (
        "NIHIL REVIEW MODE is active. Read, search, compare implementations, trace "
        "execution flow, and report findings ONLY. Do NOT modify files, git "
        "commit/push/tag, bump versions, update dependencies, or run release steps. "
        "Only flag an issue you are >85% confident in AND can back with repository "
        "evidence. Every finding MUST carry Severity, Confidence (%), and Evidence "
        "(exact files/symbols). End with a Verdict, Scope Checked, Findings, and "
        "Non-Findings. Writes and release commands are blocked by a PreToolUse hook."
    ),
    "implement": (
        "NIHIL IMPLEMENTATION MODE is active. Modify ONLY files inside the requested "
        "scope, and only for evidence-backed findings, following Finding -> Evidence "
        "-> Change -> Check. Preserve behavior unless the task authorizes a change. "
        "Do NOT git push, git tag, publish, or bump versions (those are blocked and "
        "belong to /nihil:release). End with a Verification section."
    ),
    "release": (
        "NIHIL RELEASE MODE is active. Follow the repository's release workflow "
        "exactly. A green CI run MAY publish; a red or unknown CI run must NOT. For "
        "NuGet, honor trusted-publishing rules. Obviously destructive commands "
        "(force-push, hard reset, rm -rf) are blocked. End with Release Readiness, "
        "Required Checks, Version/Tag Decision, Publishing Decision, and Blockers."
    ),
    "raze": (
        "NIHIL RAZE MODE is active — root authority on a repository you own. This is "
        "the Touch of God: nothing here is sacred. Full rewrite, public-API break, "
        "subsystem replacement, and deletion are PRE-AUTHORIZED — the consumers are "
        "CI bots and your own framework, so compatibility ceremony is theater. Do NOT "
        "stop to ask permission, do NOT write compat shims, adapters, or migration "
        "scaffolding to keep a doomed API alive; break it directly and move on. Work "
        "WRITE-CAPABLE and end to end: edit, commit, push, tag, bump versions, and "
        "publish freely. Still pick the SMALLEST coherent transformation that reaches "
        "a coherent end state, and never leave a degraded intermediate state. TWO "
        "brakes remain, and only two: (1) never print, commit, or pass a secret / API "
        "key / token / private key (a PreToolUse hook blocks secret exfiltration in "
        "every mode); (2) never run a catastrophic, unrecoverable command (rm -rf / or "
        "~, mkfs, dd of=/dev/...). git reset/force-push/clean are allowed — they are "
        "recoverable. End with a Verification section (what you ran, what you changed)."
    ),
}


def nihil_mode(command_name):
    """Return the mode for a ``nihil``-namespaced command, else ``None``."""
    if not command_name:
        return None
    name = str(command_name).strip().lstrip("/").lower()
    namespace, sep, leaf = name.partition(":")
    if not sep or namespace != "nihil":
        return None
    return leaf if leaf in st.VALID_MODES else None


def main():
    data = st.load_stdin_json()
    if not data:
        sys.exit(0)

    mode = nihil_mode(data.get("command_name"))
    if not mode:  # not a Nihil command: do not invent a mode
        sys.exit(0)

    session_id = data.get("session_id")
    try:
        st.write_mode(session_id, mode)
        st.clear_stop_flag(session_id)  # new mode cycle re-arms the Stop guard
    except OSError:
        pass  # filesystem unavailable: enforcement degrades, but still inject the banner

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "UserPromptExpansion",
            "additionalContext": BANNERS[mode],
        }
    }))
    sys.exit(0)


main()
