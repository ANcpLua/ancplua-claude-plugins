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
    r"\brm\s+-[a-zA-Z]*[rRfF]|\bgit\s+reset\s+--hard\b|\bgit\s+push\b[^\n]*(?:--force\b|--force-with-lease\b|\s-f\b)"
    r"|\bgit\s+clean\s+-[a-zA-Z]*[fF]|\bmkfs\b|\bdd\s+if=|>\s*/dev/sd"
)

# Secret / API-key exfiltration — the one guardrail that fires in EVERY mode,
# raze included. Catches credential literals, printing secret files, env-var
# echoes, committing key files, and inline --api-key/--password values. Heuristic,
# case-sensitive on the literal token prefixes; never a substitute for a scanner.
SECRET = re.compile(
    r"AKIA[0-9A-Z]{16}"
    r"|gh[posru]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}"
    r"|oy2[a-z0-9]{43}"
    r"|xox[abprs]-[A-Za-z0-9-]{10,}"
    r"|sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{16,}"
    r"|AIza[0-9A-Za-z_-]{35}"
    r"|-----BEGIN [A-Z ]*PRIVATE KEY-----"
    r"|\b(?:cat|bat|less|more|head|tail|xxd|strings|nl)\b[^\n|;&]*?"
    r"(?:\.env(?!\.(?:example|sample|template|dist)\b)(?:\.[\w.]+)?|\.pem|\.p12|\.pfx|id_rsa|id_ed25519|credentials|\.npmrc|\.pypirc)\b"
    r"|\b(?:echo|printenv|printf|env)\b[^\n]*\$\{?[A-Za-z_]*"
    r"(?:SECRET|TOKEN|API_?KEY|PASSWORD|PASSWD|PRIVATE_KEY|ACCESS_KEY)"
    r"|\bgit\s+(?:add|commit)\b[^\n]*(?:\.env(?!\.(?:example|sample|template|dist)\b)(?:\.[\w.]+)?|\.pem|id_rsa|id_ed25519|credentials|\.pfx|\.p12)\b"
    r"|--api[-_]?key[=\s]+\S|--password[=\s]+\S"
)

# Catastrophic, unrecoverable operations — raze's ONLY command brake besides
# SECRET. Deliberately narrow: only disk-wipers that no reflog or remote can undo.
# git reset/force-push/clean are NOT here — they are recoverable, and raze allows them.
CATASTROPHIC = re.compile(
    r"\brm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(?:--?[a-zA-Z][\w-]*\s+)*"
    r"(?:/|~|\$\{?HOME\}?)(?:/\*?|\*)?(?=\s|$|;|&|\|)"
    r"|\bmkfs(?:\.\w+)?\b"
    r"|\bdd\b[^\n]*\bof=/dev/[a-z]"
    r"|>\s*/dev/sd[a-z]"
    r"|:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:"
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

    # Universal guardrail: never leak a secret, in ANY Nihil mode (raze included).
    if tool == "Bash" and SECRET.search(command):
        # Never echo the raw command here — it contains the matched secret. Redact every
        # SECRET-matched span before interpolating, so the denial reason can't leak the value.
        redacted = SECRET.sub("[redacted]", command).strip()[:200]
        deny("Nihil blocks a possible secret / API-key exfiltration: `" + redacted + "`. "
             "Do not print, echo, commit, or pass credentials inline — read them from the "
             "environment or a secret store, and for NuGet use trusted publishing (OIDC).")

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

    if mode == "raze":
        # Root authority on a repo you own: writes, commits, pushes, tags, publishes,
        # version bumps, public-API breaks, full rewrites, even git reset/force-push
        # all flow. The secret brake above already applied. Only the unrecoverable is left.
        if tool in WRITE_TOOLS:
            sys.exit(0)
        if tool == "Bash" and CATASTROPHIC.search(command):
            deny("Nihil Raze Mode blocks one catastrophic, unrecoverable command: `" + snippet + "`. "
                 "Raze frees everything else — writes, commit, push, tag, publish, reset, force-push — "
                 "but rm -rf / or ~, mkfs, and dd of=/dev/... cannot be undone by any reflog or remote.")
        sys.exit(0)

    sys.exit(0)


main()
