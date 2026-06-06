"""Shared state for the Nihil hook scripts.

Single source of truth for three things the three hook entrypoints all need:
  * where per-session mode state is stored,
  * how a session id becomes a safe filename (security-sensitive — it builds a
    filesystem path, so it must never diverge between scripts), and
  * reading / writing the mode and the one-shot Stop flag.

State location: ``$CLAUDE_PLUGIN_DATA`` (the documented per-plugin persistent
data directory) when set, otherwise a temp directory. The temp fallback keeps
the hooks working under ``claude --plugin-dir`` and in any context where the
variable is not exported.

Every public helper degrades gracefully: a read returns ``None`` rather than
raising, so a caller can always fail open and never trap a session.
"""

import json
import os
import re
import sys
import tempfile

VALID_MODES = ("review", "implement", "release", "raze")


def state_dir():
    """Return a writable directory for Nihil state, creating it if needed."""
    base = (os.environ.get("CLAUDE_PLUGIN_DATA") or "").strip()
    if not base:
        base = os.path.join(tempfile.gettempdir(), "nihil-state")
    try:
        os.makedirs(base, exist_ok=True)
        return base
    except OSError:
        return tempfile.gettempdir()


def _safe_session(session_id):
    sid = re.sub(r"[^A-Za-z0-9_-]", "_", str(session_id or "unknown"))
    return sid[:128] or "unknown"


def _mode_path(session_id):
    return os.path.join(state_dir(), "mode-" + _safe_session(session_id) + ".json")


def _stop_flag_path(session_id):
    return os.path.join(state_dir(), "stopblocked-" + _safe_session(session_id))


def read_mode(session_id):
    """Return the stored mode for this session, or ``None`` if none/invalid."""
    try:
        with open(_mode_path(session_id), "r", encoding="utf-8") as fh:
            mode = json.load(fh).get("mode")
    except (OSError, ValueError):
        return None
    return mode if mode in VALID_MODES else None


def write_mode(session_id, mode):
    """Persist the active mode for this session. No-op for an unknown mode."""
    if mode not in VALID_MODES:
        return
    with open(_mode_path(session_id), "w", encoding="utf-8") as fh:
        json.dump({"mode": mode}, fh)


def stop_already_blocked(session_id):
    return os.path.exists(_stop_flag_path(session_id))


def mark_stop_blocked(session_id):
    try:
        with open(_stop_flag_path(session_id), "w", encoding="utf-8") as fh:
            fh.write("1")
    except OSError:
        pass


def clear_stop_flag(session_id):
    """Re-arm the Stop guard. Called when a new mode cycle begins."""
    try:
        os.remove(_stop_flag_path(session_id))
    except OSError:
        pass


def load_stdin_json():
    """Read and parse the hook payload from stdin. ``None`` on any failure."""
    try:
        return json.loads(sys.stdin.read() or "{}")
    except (ValueError, OSError):
        return None
