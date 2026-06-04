#!/usr/bin/env python3
"""PreToolUse hook: enforce the active Nihil mode on mutating / release tools.

Reads the persisted mode for the session and denies tool calls that violate it:

  review     blocks file writes/edits, git commit/push/tag, version bumps,
             dependency updates, package publishing, and destructive shell.
  implement  blocks git push/tag, version bumps, publishing, and destructive
             shell (writes, edits, and git commit are allowed).
  release    blocks only obviously destructive shell (force-push, hard reset,
             rm -rf); release-like commands are permitted.

If the session has no Nihil mode, the hook allows everything (exit 0) — it is a
no-op outside a Nihil workflow. The matcher in hooks.json restricts this hook to
``Write|Edit|MultiEdit|NotebookEdit|Bash`` so read/search tools never pay for it.

Bash matching is a documented heuristic on the command string: precise enough to
catch the named operations, deliberately not a sandbox. See README "What the
PreToolUse hook does and does not catch".
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import _nihil_state as st
except ImportError:  # helper missing: fail open so no tool call is ever blocked
    sys.exit(0)

WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}

GIT_COMMIT = re.compile(r"\bgit\s+commit\b")
GIT_PUSH = re.compile(r"\bgit\s+push\b")
# tag mutation (create/delete/force) — the listing forms `git tag`, `git tag -l`,
# `git tag --list`, `git tag -n` are read-only and pass.
GIT_TAG_MUTATE = re.compile(r"\bgit\s+tag\s+(?!(?:-l\b|--list\b|-n))\S")
VERSION_BUMP = re.compile(
    r"\b(?:npm|pnpm|yarn)\s+version\b|\bhatch\s+version\b|\bbump2?version\b|\bpoetry\s+version\b"
)
PUBLISH = re.compile(
    r"\b(?:npm|pnpm|yarn)\s+publish\b|\bdotnet\s+nuget\s+push\b|\bnuget\s+push\b"
    r"|\bgh\s+release\s+create\b|\btwine\s+upload\b|\bcargo\s+publish\b"
)
DEP_UPDATE = re.compile(
    r"\b(?:npm|pnpm|yarn)\s+(?:install|add|up|update|upgrade)\b|\bpip\s+install\b"
    r"|\bdotnet\s+add\s+(?:package|reference)\b|\bnuget\s+(?:install|update)\b|\bcargo\s+(?:add|update)\b"
)
DESTRUCTIVE = re.compile(
    r"\brm\s+-[a-z]*[rf]|\bgit\s+reset\s+--hard\b|\bgit\s+push\b[^\n]*(?:--force\b|--force-with-lease\b|\s-f\b)"
    r"|\bgit\s+clean\s+-[a-z]*f|\bmkfs\b|\bdd\s+if=|>\s*/dev/sd"
)


def deny(reason):
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def bash_command(tool_input):
    return str(tool_input.get("command", "")) if isinstance(tool_input, dict) else ""


def first_match(command, rules):
    """Return the label of the first matching rule, or ``None``."""
    for label, rx in rules:
        if rx.search(command):
            return label
    return None


def main():
    data = st.load_stdin_json()
    if not data:
        sys.exit(0)

    mode = st.read_mode(data.get("session_id"))
    if not mode:  # not a Nihil-governed session
        sys.exit(0)

    tool = data.get("tool_name", "")
    command = bash_command(data.get("tool_input"))
    snippet = command.strip()[:200]

    if mode == "review":
        if tool in WRITE_TOOLS:
            deny("Nihil Review Mode is read-only — file writes/edits are blocked. "
                 "Switch to /nihil:implement to make changes.")
        if tool == "Bash":
            hit = first_match(command, (
                ("git commit", GIT_COMMIT), ("git push", GIT_PUSH), ("git tag", GIT_TAG_MUTATE),
                ("a version bump", VERSION_BUMP), ("package publishing", PUBLISH),
                ("a dependency update", DEP_UPDATE), ("a destructive command", DESTRUCTIVE),
            ))
            if hit:
                deny("Nihil Review Mode blocks " + hit + ": `" + snippet + "`. "
                     "Review Mode reports findings only — no mutations, git writes, or release steps.")
        sys.exit(0)

    if mode == "implement":
        if tool == "Bash":
            hit = first_match(command, (
                ("git push", GIT_PUSH), ("git tag", GIT_TAG_MUTATE), ("package publishing", PUBLISH),
                ("a version bump", VERSION_BUMP), ("a destructive command", DESTRUCTIVE),
            ))
            if hit:
                deny("Nihil Implementation Mode blocks " + hit + ": `" + snippet + "`. "
                     "Push / tag / publish / version-bump are release steps — use /nihil:release.")
        sys.exit(0)  # writes, edits, and git commit are allowed in implement mode

    if mode == "release":
        if tool == "Bash" and DESTRUCTIVE.search(command):
            deny("Nihil Release Mode blocks an obviously destructive command: `" + snippet + "`. "
                 "Release Mode permits release-like commands but not force-push / hard reset / rm -rf.")
        sys.exit(0)

    sys.exit(0)


main()
